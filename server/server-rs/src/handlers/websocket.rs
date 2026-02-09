//! WebSocket handler for Gemini Live API proxy.
//!
//! # Endpoint: `GET /ws`
//!
//! WebSocket endpoint that proxies audio/video/text between the client and Gemini Live API.
//!
//! ## Query Parameters
//!
//! | Parameter | Required | Description |
//! |-----------|----------|-------------|
//! | `token` | Yes | Session token from `/api/auth` |
//!
//! ## Connection Flow
//!
//! ```text
//! Client                    Server                    Gemini Live API
//!   │                          │                            │
//!   │── GET /ws?token=xxx ────►│                            │
//!   │◄──── WS Upgrade ─────────│                            │
//!   │                          │                            │
//!   │── Setup Config (JSON) ──►│                            │
//!   │                          │── Connect (WSS) ──────────►│
//!   │                          │◄── Connected ──────────────│
//!   │                          │── Setup Message ──────────►│
//!   │                          │                            │
//!   │── Audio (Binary) ───────►│── Audio (Base64 JSON) ────►│
//!   │◄── Audio (Binary) ───────│◄── Audio Response ─────────│
//!   │◄── Transcript (JSON) ────│◄── Transcription ──────────│
//!   │                          │                            │
//! ```
//!
//! ## Message Types
//!
//! ### Client → Server
//!
//! - **Binary**: Raw PCM audio (16-bit, 16kHz, mono)
//! - **Text (JSON)**: Setup config or text messages
//!
//! ### Server → Client
//!
//! - **Binary**: Raw PCM audio from Gemini (24kHz)
//! - **Text (JSON)**: Events (transcriptions, interrupts, etc.)

use axum::{
    extract::{ws::WebSocket, Query, State, WebSocketUpgrade},
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use std::time::Duration;
use tokio::sync::mpsc;

use crate::{
    error::{AppError, Result},
    gemini::GeminiLiveClient,
    state::AppState,
};

#[derive(Deserialize)]
pub struct WsQuery {
    token: Option<String>,
}

/// WebSocket upgrade handler.
///
/// Validates the session token and upgrades to WebSocket.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(query): Query<WsQuery>,
) -> Result<Response> {
    // Validate token and get session duration
    let token = query.token.ok_or(AppError::InvalidToken)?;

    let session_duration = state
        .consume_token(&token)
        .await
        .ok_or(AppError::InvalidToken)?;

    tracing::info!(
        "WebSocket connection authenticated with session duration: {}s",
        session_duration
    );

    Ok(ws.on_upgrade(move |socket| handle_socket(socket, state, session_duration)))
}

/// Handle the WebSocket connection.
async fn handle_socket(socket: WebSocket, state: AppState, session_duration: u64) {
    if let Err(e) = handle_socket_inner(socket, state, session_duration).await {
        tracing::error!("WebSocket session error: {}", e);
    }
}

async fn handle_socket_inner(
    socket: WebSocket,
    state: AppState,
    session_duration: u64,
) -> anyhow::Result<()> {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Wait for setup message from client
    let setup_config = match ws_receiver.next().await {
        Some(Ok(msg)) => {
            if let axum::extract::ws::Message::Text(text) = msg {
                let data: serde_json::Value = serde_json::from_str(&text)?;
                data.get("setup").cloned()
            } else {
                None
            }
        }
        _ => None,
    };

    // Log feature flags from setup config
    if let Some(ref config) = setup_config {
        let has_input_transcription = config
            .get("realtimeInputConfig")
            .and_then(|c| c.get("automaticActivityDetection"))
            .and_then(|c| c.get("speechConfig"))
            .and_then(|c| c.get("voiceActivityDetection"))
            .is_some()
            || config
                .get("input_audio_transcription")
                .map(|v| !v.is_null())
                .unwrap_or(false);
        let has_output_transcription = config
            .get("output_audio_transcription")
            .map(|v| !v.is_null())
            .unwrap_or(false);
        let has_tools = config
            .get("tools")
            .map(|v| !v.is_null() && v.as_array().map(|a| !a.is_empty()).unwrap_or(false))
            .unwrap_or(false);

        tracing::info!(
            "Client setup - input_transcription: {}, output_transcription: {}, has_tools: {}",
            has_input_transcription,
            has_output_transcription,
            has_tools
        );
    } else {
        tracing::info!("Received setup config: None");
    }

    // Create channels for communication
    let (audio_tx, audio_rx) = mpsc::channel::<Vec<u8>>(100);
    let (text_tx, text_rx) = mpsc::channel::<String>(100);
    let (event_tx, mut event_rx) = mpsc::channel::<ClientEvent>(100);

    // Connect to Gemini Live API
    let gemini_client = GeminiLiveClient::new(
        state.config.clone(),
        setup_config,
        audio_rx,
        text_rx,
        event_tx,
    );

    // Spawn Gemini session task
    let session_handle = tokio::spawn(async move {
        if let Err(e) = gemini_client.run().await {
            tracing::error!("Gemini session error: {}", e);
        }
    });

    // Spawn task to receive from client
    let receive_handle = tokio::spawn(async move {
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(axum::extract::ws::Message::Binary(data)) => {
                    // Audio data
                    let _ = audio_tx.send(data.to_vec()).await;
                }
                Ok(axum::extract::ws::Message::Text(text)) => {
                    // Text or JSON message
                    let _ = text_tx.send(text.to_string()).await;
                }
                Ok(axum::extract::ws::Message::Close(_)) => {
                    tracing::info!("Client closed connection");
                    break;
                }
                Err(e) => {
                    tracing::error!("WebSocket receive error: {}", e);
                    break;
                }
                _ => {}
            }
        }
    });

    // Forward events from Gemini to client (use custom session duration)
    let session_timeout = Duration::from_secs(session_duration);

    let forward_handle = tokio::spawn(async move {
        let deadline = tokio::time::Instant::now() + session_timeout;

        loop {
            tokio::select! {
                _ = tokio::time::sleep_until(deadline) => {
                    tracing::info!("Session time limit reached");
                    let _ = ws_sender
                        .send(axum::extract::ws::Message::Close(None))
                        .await;
                    break;
                }
                event = event_rx.recv() => {
                    match event {
                        Some(ClientEvent::Audio(data)) => {
                            if ws_sender
                                .send(axum::extract::ws::Message::Binary(data.into()))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        Some(ClientEvent::Json(json)) => {
                            if ws_sender
                                .send(axum::extract::ws::Message::Text(json.into()))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        Some(ClientEvent::Error { message, stats }) => {
                            // Send error as JSON message to client
                            let error_json = serde_json::json!({
                                "error": {
                                    "message": message,
                                    "code": "SESSION_ERROR",
                                    "stats": stats
                                }
                            }).to_string();
                            tracing::info!("Sending error to client: {}", error_json);
                            let _ = ws_sender
                                .send(axum::extract::ws::Message::Text(error_json.into()))
                                .await;
                        }
                        Some(ClientEvent::SessionEnd { stats }) => {
                            // Send session end with stats
                            let end_json = serde_json::json!({
                                "sessionEnd": {
                                    "stats": stats
                                }
                            }).to_string();
                            tracing::info!("Sending session end to client: {}", end_json);
                            let _ = ws_sender
                                .send(axum::extract::ws::Message::Text(end_json.into()))
                                .await;
                        }
                        Some(ClientEvent::Close) | None => {
                            let _ = ws_sender
                                .send(axum::extract::ws::Message::Close(None))
                                .await;
                            break;
                        }
                    }
                }
            }
        }
    });

    // Wait for any task to complete
    tokio::select! {
        _ = session_handle => {}
        _ = receive_handle => {}
        _ = forward_handle => {}
    }

    tracing::info!("WebSocket session ended");
    Ok(())
}

/// Session statistics for reporting to client
#[derive(Debug, Clone, serde::Serialize)]
pub struct SessionStats {
    pub message_count: u64,
    pub audio_chunks_sent: u64,
    pub elapsed_seconds: f64,
    pub total_token_count: u32,
    pub prompt_token_count: u32,
    pub response_token_count: u32,
}

/// Events sent to the client.
#[derive(Debug)]
pub enum ClientEvent {
    /// Raw audio data
    Audio(Vec<u8>),
    /// JSON event (transcription, turn complete, etc.)
    Json(String),
    /// Error event with message and optional stats
    Error { message: String, stats: Option<SessionStats> },
    /// Session ended normally with stats
    SessionEnd { stats: SessionStats },
    /// Close connection
    Close,
}
