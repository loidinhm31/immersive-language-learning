//! Gemini Live API WebSocket client.
//!
//! Handles bidirectional streaming between the server and Gemini Live API.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::Message};

use crate::{
    config::Config,
    handlers::websocket::ClientEvent,
};

use super::messages::*;

/// Gemini Live API client.
///
/// Manages the WebSocket connection and message routing.
pub struct GeminiLiveClient {
    config: Config,
    setup_config: Option<serde_json::Value>,
    audio_rx: mpsc::Receiver<Vec<u8>>,
    text_rx: mpsc::Receiver<String>,
    event_tx: mpsc::Sender<ClientEvent>,
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

        let audio_sender_tx = gemini_send_tx.clone();
        let sample_rate = self.config.input_sample_rate;
        let mut audio_rx = self.audio_rx;

        tokio::spawn(async move {
            let mut audio_chunk_count = 0u64;
            while let Some(audio_data) = audio_rx.recv().await {
                audio_chunk_count += 1;
                if audio_chunk_count % 50 == 1 {
                    tracing::debug!("Received audio chunk #{} from client ({} bytes)", audio_chunk_count, audio_data.len());
                }
                let msg = RealtimeInputMessage {
                    realtime_input: RealtimeInput::audio_pcm(&audio_data, sample_rate),
                };
                if let Ok(json) = serde_json::to_string(&msg) {
                    let _ = audio_sender_tx.send(json).await;
                }
            }
            tracing::debug!("Audio sender task ended after {} chunks", audio_chunk_count);
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

        tracing::debug!("Starting main receive loop from Gemini...");

        let mut msg_count = 0u64;
        while let Some(msg) = ws_receiver.next().await {
            msg_count += 1;
            match msg {
                Ok(Message::Text(text)) => {
                    tracing::debug!("Received text message from Gemini ({} bytes)", text.len());
                    if let Err(e) = Self::handle_gemini_message(&text, &event_tx).await {
                        tracing::error!("Error handling Gemini message: {}", e);
                    }
                }
                Ok(Message::Binary(data)) => {
                    // Gemini sends JSON messages as binary WebSocket frames
                    // Parse as UTF-8 string and handle as JSON
                    match String::from_utf8(data.to_vec()) {
                        Ok(text) => {
                            tracing::debug!("Received binary JSON from Gemini ({} bytes)", text.len());
                            if let Err(e) = Self::handle_gemini_message(&text, &event_tx).await {
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
                    if let Some(ref frame) = reason {
                        tracing::warn!(
                            "Gemini closed - Code: {:?}, Reason: {}",
                            frame.code,
                            frame.reason
                        );
                        if frame.reason.contains("Policy") || frame.reason.contains("not implemented") || frame.reason.contains("not supported") || frame.reason.contains("not enabled") {
                            tracing::error!(
                                "POLICY VIOLATION DETECTED - Check: model support for Live API, incompatible feature combinations (e.g., transcription + tools), API key restrictions, or region limitations"
                            );
                            // Send error to client before closing
                            let error_message = format!(
                                "Session ended: {}. This may be due to an unsupported feature combination or API limitation.",
                                frame.reason
                            );
                            let _ = event_tx.send(ClientEvent::Error(error_message)).await;
                        }
                    } else {
                        tracing::info!("Gemini closed connection (no reason provided)");
                    }
                    break;
                }
                Ok(Message::Ping(_)) | Ok(Message::Pong(_)) => {}
                Err(e) => {
                    tracing::error!("Gemini WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }
        tracing::debug!("Gemini receive loop ended after {} messages", msg_count);

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

        tracing::info!(
            "Setup config - Model: {}, Has tools: {}, Has system_instruction: {}",
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
            },
        }
    }

    /// Handle a message from Gemini and forward relevant events to the client.
    async fn handle_gemini_message(
        text: &str,
        event_tx: &mpsc::Sender<ClientEvent>,
    ) -> anyhow::Result<()> {
        // Log raw message for debugging (truncate if too long)
        let preview = if text.len() > 500 { &text[..500] } else { text };
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
                "ServerContent - model_turn: {:?}, input_transcription: {:?}, output_transcription: {:?}, turn_complete: {:?}, interrupted: {:?}",
                server_content.model_turn.is_some(),
                server_content.input_transcription.is_some(),
                server_content.output_transcription.is_some(),
                server_content.turn_complete,
                server_content.interrupted
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
            };
            let json = serde_json::to_string(&event_msg)?;
            event_tx.send(ClientEvent::Json(json)).await?;
        }

        // Handle usage metadata
        if let Some(usage) = msg.usage_metadata {
            let prompt = usage.prompt_token_count.unwrap_or(0);
            let candidates = usage.candidates_token_count.unwrap_or(0);
            let total = usage.total_token_count.unwrap_or(0);

            tracing::info!(
                "Token usage - prompt: {}, candidates: {}, total: {}",
                prompt, candidates, total
            );

            let event_msg = ClientEventMessage {
                server_content: None,
                tool_call: None,
                usage_metadata: Some(ClientUsageMetadata {
                    prompt_token_count: prompt,
                    candidates_token_count: candidates,
                    total_token_count: total,
                }),
            };
            let json = serde_json::to_string(&event_msg)?;
            event_tx.send(ClientEvent::Json(json)).await?;
        }

        Ok(())
    }
}
