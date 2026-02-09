//! Gemini Live API WebSocket client.
//!
//! Handles bidirectional streaming between the server and Gemini Live API.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message};

use crate::{
    config::Config,
    handlers::websocket::{ClientEvent, SessionStats},
};

use super::messages::*;

/// Safely truncate a UTF-8 string to approximately `max_chars` characters.
/// This avoids panicking when slicing in the middle of multi-byte characters.
fn truncate_string(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max_chars).collect();
        format!("{}...", truncated)
    }
}

/// Gemini Live API client.
///
/// Manages the WebSocket connection and message routing.
pub struct GeminiLiveClient {
    config: Config,
    setup_config: Option<serde_json::Value>,
    audio_rx: mpsc::Receiver<Vec<u8>>,
    text_rx: mpsc::Receiver<String>,
    event_tx: mpsc::Sender<ClientEvent>,
    session_start: Instant,
}

impl GeminiLiveClient {
    pub fn new(
        config: Config,
        setup_config: Option<serde_json::Value>,
        audio_rx: mpsc::Receiver<Vec<u8>>,
        text_rx: mpsc::Receiver<String>,
        event_tx: mpsc::Sender<ClientEvent>,
    ) -> Self {
        Self {
            config,
            setup_config,
            audio_rx,
            text_rx,
            event_tx,
            session_start: Instant::now(),
        }
    }

    /// Run the Gemini Live session.
    ///
    /// This method:
    /// 1. Connects to the Gemini Live API via WebSocket
    /// 2. Sends the setup configuration
    /// 3. Proxies audio/text between the client and Gemini
    /// 4. Forwards responses back to the client
    pub async fn run(self) -> anyhow::Result<()> {
        // Build WebSocket URL
        let ws_url = self.config.gemini_ws_url()?;
        tracing::info!("Connecting to Gemini Live API");

        // Connect to Gemini
        let (ws_stream, _) = connect_async(&ws_url).await?;
        let (mut ws_sender, mut ws_receiver) = ws_stream.split();

        tracing::info!("Connected to Gemini Live API");

        // Send setup message
        let setup_msg = self.build_setup_message();
        let setup_json = serde_json::to_string(&setup_msg)?;
        tracing::debug!("Sending setup to Gemini: {}", setup_json);
        ws_sender.send(Message::Text(setup_json.into())).await?;

        // Wait for setup complete
        // Note: Gemini sends JSON as binary WebSocket frames
        tracing::debug!("Waiting for setup response from Gemini...");
        if let Some(msg) = ws_receiver.next().await {
            let text = match msg {
                Ok(Message::Text(t)) => Some(t.to_string()),
                Ok(Message::Binary(data)) => String::from_utf8(data.to_vec()).ok(),
                Ok(Message::Close(reason)) => {
                    tracing::warn!("Gemini closed connection during setup: {:?}", reason);
                    return Ok(());
                }
                Err(e) => {
                    tracing::error!("Setup error: {}", e);
                    return Err(e.into());
                }
                _ => None,
            };

            if let Some(text) = text {
                tracing::debug!("Setup response: {}", text);
                match serde_json::from_str::<ServerMessage>(&text) {
                    Ok(response) => {
                        if response.setup_complete.is_some() {
                            tracing::info!("Gemini session setup complete");
                        } else {
                            tracing::warn!("Setup response did not contain setupComplete");
                        }
                    }
                    Err(e) => {
                        tracing::error!("Failed to parse setup response: {} - raw: {}", e, text);
                    }
                }
            } else {
                tracing::warn!("Unexpected message type during setup");
            }
        } else {
            tracing::error!("No setup response received from Gemini");
        }

        // Spawn task to send audio to Gemini
        let (gemini_send_tx, mut gemini_send_rx) = mpsc::channel::<String>(100);

        // Shared counter for audio chunks sent
        let audio_chunk_count = Arc::new(AtomicU64::new(0));
        let audio_chunk_count_clone = audio_chunk_count.clone();

        let audio_sender_tx = gemini_send_tx.clone();
        let sample_rate = self.config.input_sample_rate;
        let mut audio_rx = self.audio_rx;

        tokio::spawn(async move {
            while let Some(audio_data) = audio_rx.recv().await {
                let count = audio_chunk_count_clone.fetch_add(1, Ordering::Relaxed) + 1;
                if count % 50 == 1 {
                    tracing::debug!("Received audio chunk #{} from client ({} bytes)", count, audio_data.len());
                }
                let msg = RealtimeInputMessage {
                    realtime_input: RealtimeInput::audio_pcm(&audio_data, sample_rate),
                };
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = audio_sender_tx.send(json).await;
                }
            }
            tracing::debug!("Audio sender task ended after {} chunks", audio_chunk_count_clone.load(Ordering::Relaxed));
        });

        // Spawn task to send text to Gemini
        let text_sender_tx = gemini_send_tx.clone();
        let mut text_rx = self.text_rx;

        tokio::spawn(async move {
            while let Some(text) = text_rx.recv().await {
                // Check if it's already a JSON command
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                    // Forward as-is if it's a valid JSON object
                    if parsed.is_object() {
                        let _ = text_sender_tx.send(text).await;
                        continue;
                    }
                }

                // Otherwise, wrap as client content
                let msg = ClientContentMessage {
                    client_content: ClientContent {
                        turns: vec![Content {
                            parts: vec![InputPart {
                                text: Some(text),
                                inline_data: None,
                            }],
                            role: Some("user".to_string()),
                        }],
                        turn_complete: true,
                    },
                };
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = text_sender_tx.send(json).await;
                }
            }
        });

        // Spawn task to send messages to Gemini WebSocket
        let send_handle = tokio::spawn(async move {
            while let Some(msg) = gemini_send_rx.recv().await {
                if ws_sender.send(Message::Text(msg.into())).await.is_err() {
                    break;
                }
            }
        });

        // Process responses from Gemini
        let event_tx = self.event_tx;
        let session_start = self.session_start;

        tracing::debug!("Starting main receive loop from Gemini...");

        // Keep track of recent messages for debugging policy violations
        let mut recent_messages: std::collections::VecDeque<String> = std::collections::VecDeque::with_capacity(5);

        // Track latest token usage from Gemini (values are cumulative per session)
        let mut last_total_tokens: u32 = 0;
        let mut last_prompt_tokens: u32 = 0;
        let mut last_response_tokens: u32 = 0;

        let mut msg_count = 0u64;
        while let Some(msg) = ws_receiver.next().await {
            msg_count += 1;
            match msg {
                Ok(Message::Text(text)) => {
                    tracing::debug!("Received text message from Gemini ({} bytes)", text.len());
                    // Track recent messages for debugging
                    if recent_messages.len() >= 5 {
                        recent_messages.pop_front();
                    }
                    let preview = truncate_string(&text, 200);
                    recent_messages.push_back(preview);

                    if let Err(e) = Self::handle_gemini_message(&text, &event_tx, msg_count, &audio_chunk_count, &session_start, &mut last_total_tokens, &mut last_prompt_tokens, &mut last_response_tokens).await {
                        tracing::error!("Error handling Gemini message: {}", e);
                    }
                }
                Ok(Message::Binary(data)) => {
                    // Gemini sends JSON messages as binary WebSocket frames
                    // Parse as UTF-8 string and handle as JSON
                    match String::from_utf8(data.to_vec()) {
                        Ok(text) => {
                            tracing::debug!("Received binary JSON from Gemini ({} bytes)", text.len());
                            // Track recent messages for debugging
                            if recent_messages.len() >= 5 {
                                recent_messages.pop_front();
                            }
                            let preview = truncate_string(&text, 200);
                            recent_messages.push_back(preview);

                            if let Err(e) = Self::handle_gemini_message(&text, &event_tx, msg_count, &audio_chunk_count, &session_start, &mut last_total_tokens, &mut last_prompt_tokens, &mut last_response_tokens).await {
                                tracing::error!("Error handling Gemini message: {}", e);
                            }
                        }
                        Err(_) => {
                            // Truly binary data (unlikely, but handle it)
                            tracing::warn!("Received non-UTF8 binary from Gemini: {} bytes", data.len());
                            let mut audio_data = data.to_vec();
                            if audio_data.len() % 2 != 0 {
                                audio_data.push(0);
                            }
                            let _ = event_tx.send(ClientEvent::Audio(audio_data)).await;
                        }
                    }
                }
                Ok(Message::Close(reason)) => {
                    let audio_chunks = audio_chunk_count.load(Ordering::Relaxed);
                    let elapsed = session_start.elapsed().as_secs_f64();
                    let stats = SessionStats {
                        message_count: msg_count,
                        audio_chunks_sent: audio_chunks,
                        elapsed_seconds: elapsed,
                        total_token_count: last_total_tokens,
                        prompt_token_count: last_prompt_tokens,
                        response_token_count: last_response_tokens,
                    };

                    if let Some(ref frame) = reason {
                        tracing::warn!(
                            "Gemini closed - Code: {:?}, Reason: {} (after {} messages, {} audio chunks, {:.1}s elapsed, {} tokens)",
                            frame.code,
                            frame.reason,
                            msg_count,
                            audio_chunks,
                            elapsed,
                            last_total_tokens
                        );

                        // Determine if this is likely a session limit vs early policy error
                        let is_likely_session_limit = msg_count > 100; // If we got >100 messages, features work

                        if frame.reason.contains("Internal error") {
                            tracing::warn!(
                                "Gemini internal error after {} messages - may be caused by tool response issues or transient API failure",
                                msg_count
                            );
                            let error_message = "Session ended unexpectedly: Gemini encountered an internal error. Please try again.".to_string();
                            let _ = event_tx.send(ClientEvent::Error { message: error_message, stats: Some(stats) }).await;
                        } else if frame.reason.contains("Policy") || frame.reason.contains("not implemented") || frame.reason.contains("not supported") || frame.reason.contains("not enabled") {
                            if is_likely_session_limit {
                                // Session ran for a while - this is likely a context/duration limit
                                tracing::info!(
                                    "Session ended after {} messages, {} audio chunks - likely hit Gemini's session or context limit",
                                    msg_count,
                                    audio_chunks
                                );
                                let error_message = "Session ended: Gemini's session limit reached. Please start a new conversation.".to_string();
                                let _ = event_tx.send(ClientEvent::Error { message: error_message, stats: Some(stats) }).await;
                            } else {
                                // Early termination - likely a real feature incompatibility
                                tracing::error!(
                                    "POLICY VIOLATION DETECTED - Check: model support for Live API, incompatible feature combinations (e.g., transcription + tools), API key restrictions, or region limitations"
                                );
                                // Log recent messages for debugging
                                tracing::error!("Last {} messages before policy violation:", recent_messages.len());
                                for (i, msg) in recent_messages.iter().enumerate() {
                                    tracing::error!("  [{}]: {}", i + 1, msg);
                                }
                                // Send error to client before closing
                                let error_message = format!(
                                    "Session ended: {}. This may be due to an unsupported feature combination or API limitation.",
                                    frame.reason
                                );
                                let _ = event_tx.send(ClientEvent::Error { message: error_message, stats: Some(stats) }).await;
                            }
                        } else {
                            // Normal close with a reason
                            let _ = event_tx.send(ClientEvent::SessionEnd { stats }).await;
                        }
                    } else {
                        tracing::info!("Gemini closed connection (no reason provided) after {} messages, {} audio chunks", msg_count, audio_chunks);
                        let _ = event_tx.send(ClientEvent::SessionEnd { stats }).await;
                    }
                    break;
                }
                Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => {}
                Err(e) => {
                    let audio_chunks = audio_chunk_count.load(Ordering::Relaxed);
                    let elapsed = session_start.elapsed().as_secs_f64();
                    tracing::error!("Gemini WebSocket error: {} (after {} messages, {} audio chunks, {:.1}s elapsed, {} tokens)", e, msg_count, audio_chunks, elapsed, last_total_tokens);
                    let stats = SessionStats {
                        message_count: msg_count,
                        audio_chunks_sent: audio_chunks,
                        elapsed_seconds: elapsed,
                        total_token_count: last_total_tokens,
                        prompt_token_count: last_prompt_tokens,
                        response_token_count: last_response_tokens,
                    };
                    let _ = event_tx.send(ClientEvent::Error {
                        message: format!("Connection error: {}", e),
                        stats: Some(stats),
                    }).await;
                    break;
                }
                _ => {}
            }
        }
        tracing::debug!("Gemini receive loop ended after {} messages", msg_count);

        // Send close signal (SessionEnd/Error already sent from handlers above)
        let _ = event_tx.send(ClientEvent::Close).await;
        send_handle.abort();

        Ok(())
    }

    /// Build the setup message from client config and defaults.
    fn build_setup_message(&self) -> SetupMessage {
        let model = format!("models/{}", self.config.model);

        // Start with defaults
        let mut generation_config = GenerationConfig {
            response_modalities: Some(vec!["AUDIO".to_string()]),
            speech_config: None,
        };

        let mut system_instruction: Option<Content> = None;
        let mut tools: Option<Vec<Tool>> = None;

        // Override with client config if provided
        if let Some(setup) = &self.setup_config {
            // Parse generation config
            if let Some(gen) = setup.get("generation_config") {
                if let Some(modalities) = gen.get("response_modalities") {
                    if let Ok(m) = serde_json::from_value(modalities.clone()) {
                        generation_config.response_modalities = Some(m);
                    }
                }
                if let Some(speech) = gen.get("speech_config") {
                    if let Ok(s) = serde_json::from_value(speech.clone()) {
                        generation_config.speech_config = Some(s);
                    }
                }
            }

            // Parse system instruction
            if let Some(sys) = setup.get("system_instruction") {
                if let Ok(s) = serde_json::from_value(sys.clone()) {
                    system_instruction = Some(s);
                }
            }

            // Parse tools
            if let Some(t) = setup.get("tools") {
                if let Ok(parsed_tools) = serde_json::from_value(t.clone()) {
                    tools = Some(vec![parsed_tools]);
                }
            }
        }

        // Enable context window compression to extend sessions beyond the default limit.
        // Without this, sessions hit the 128K context window and Gemini closes with a Policy error.
        let context_window_compression = Some(ContextWindowCompression {
            trigger_tokens: 100000,
            sliding_window: SlidingWindow {
                target_tokens: 50000,
            },
        });

        tracing::info!(
            "Setup config - Model: {}, Has tools: {}, Has system_instruction: {}, Context compression: enabled (trigger: 100K, target: 50K)",
            model,
            tools.is_some(),
            system_instruction.is_some()
        );

        SetupMessage {
            setup: SetupConfig {
                model,
                generation_config: Some(generation_config),
                system_instruction,
                tools,
                context_window_compression,
            },
        }
    }

    /// Handle a message from Gemini and forward relevant events to the client.
    async fn handle_gemini_message(
        text: &str,
        event_tx: &mpsc::Sender<ClientEvent>,
        msg_count: u64,
        audio_chunk_count: &Arc<AtomicU64>,
        session_start: &Instant,
        last_total_tokens: &mut u32,
        last_prompt_tokens: &mut u32,
        last_response_tokens: &mut u32,
    ) -> anyhow::Result<()> {
        // Log raw message for debugging (truncate if too long)
        let preview = truncate_string(text, 500);
        tracing::debug!("Raw Gemini message: {}", preview);

        // First parse as generic JSON to see actual field names
        if let Ok(raw_json) = serde_json::from_str::<serde_json::Value>(text) {
            let keys: Vec<&str> = raw_json.as_object()
                .map(|obj| obj.keys().map(|s| s.as_str()).collect())
                .unwrap_or_default();
            tracing::debug!("Gemini message keys: {:?}", keys);
        }

        let msg: ServerMessage = serde_json::from_str(text)?;

        tracing::debug!(
            "Parsed message - setup_complete: {:?}, server_content: {:?}, tool_call: {:?}, usage_metadata: {:?}",
            msg.setup_complete.is_some(),
            msg.server_content.is_some(),
            msg.tool_call.is_some(),
            msg.usage_metadata.is_some()
        );

        if let Some(server_content) = msg.server_content {
            tracing::debug!(
                "ServerContent - model_turn: {:?}, input_transcription: {:?}, output_transcription: {:?}, turn_complete: {:?}, interrupted: {:?}, generation_complete: {:?}",
                server_content.model_turn.is_some(),
                server_content.input_transcription.is_some(),
                server_content.output_transcription.is_some(),
                server_content.turn_complete,
                server_content.interrupted,
                server_content.generation_complete
            );

            // Extract audio data and send as binary
            if let Some(model_turn) = &server_content.model_turn {
                tracing::debug!("ModelTurn has {} parts", model_turn.parts.len());
                for (i, part) in model_turn.parts.iter().enumerate() {
                    tracing::debug!(
                        "Part {}: text={:?}, inline_data={:?}",
                        i,
                        part.text.is_some(),
                        part.inline_data.is_some()
                    );
                    if let Some(inline_data) = &part.inline_data {
                        tracing::debug!(
                            "Audio data received: mime_type={}, data_len={}",
                            inline_data.mime_type,
                            inline_data.data.len()
                        );
                        if inline_data.mime_type.starts_with("audio/") {
                            let mut audio_data = BASE64.decode(&inline_data.data)?;
                            tracing::debug!(
                                "Decoded audio: {} bytes (even: {})",
                                audio_data.len(),
                                audio_data.len() % 2 == 0
                            );
                            // Ensure byte length is even for PCM16 (2 bytes per sample)
                            // Int16Array requires buffer length to be a multiple of 2
                            if audio_data.len() % 2 != 0 {
                                audio_data.push(0);
                            }
                            event_tx.send(ClientEvent::Audio(audio_data)).await?;
                        }
                    }
                }
            }

            // Build client event for transcriptions/status
            let mut client_content = ClientServerContent {
                input_transcription: None,
                output_transcription: None,
                turn_complete: None,
                interrupted: None,
            };

            let mut has_event = false;

            if let Some(input) = server_content.input_transcription {
                client_content.input_transcription = Some(ClientTranscription {
                    text: input.text,
                    finished: true,
                });
                has_event = true;
            }

            if let Some(output) = server_content.output_transcription {
                client_content.output_transcription = Some(ClientTranscription {
                    text: output.text,
                    finished: true,
                });
                has_event = true;
            }

            if server_content.turn_complete == Some(true) {
                client_content.turn_complete = Some(true);
                has_event = true;
            }

            if server_content.interrupted == Some(true) {
                client_content.interrupted = Some(true);
                has_event = true;
            }

            if has_event {
                let event_msg = ClientEventMessage {
                    server_content: Some(client_content),
                    tool_call: None,
                    usage_metadata: None,
                    session_stats: None,
                };
                let json = serde_json::to_string(&event_msg)?;
                event_tx.send(ClientEvent::Json(json)).await?;
            }
        }

        // Handle tool calls
        if let Some(tool_call) = msg.tool_call {
            let event_msg = ClientEventMessage {
                server_content: None,
                tool_call: Some(ClientToolCall {
                    function_calls: tool_call.function_calls.into_iter().map(|fc| fc.into()).collect(),
                }),
                usage_metadata: None,
                session_stats: Some(ClientSessionStats {
                    message_count: msg_count,
                    audio_chunks_sent: audio_chunk_count.load(Ordering::Relaxed),
                    elapsed_seconds: session_start.elapsed().as_secs_f64(),
                }),
            };
            let json = serde_json::to_string(&event_msg)?;
            event_tx.send(ClientEvent::Json(json)).await?;
        }

        // Handle usage metadata
        if let Some(usage) = msg.usage_metadata {
            let prompt = usage.prompt_token_count.unwrap_or(0);
            let response = usage.response_token_count.unwrap_or(0);
            let total = usage.total_token_count.unwrap_or(0);

            // Update latest token counts
            *last_total_tokens = total;
            *last_prompt_tokens = prompt;
            *last_response_tokens = response;

            tracing::info!(
                "Token usage - prompt: {}, response: {}, total: {}",
                prompt, response, total
            );

            let event_msg = ClientEventMessage {
                server_content: None,
                tool_call: None,
                usage_metadata: Some(ClientUsageMetadata {
                    prompt_token_count: prompt,
                    response_token_count: response,
                    total_token_count: total,
                }),
                session_stats: None,
            };
            let json = serde_json::to_string(&event_msg)?;
            event_tx.send(ClientEvent::Json(json)).await?;
        }

        Ok(())
    }
}
