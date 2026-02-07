//! Authentication handler.
//!
//! # Endpoint: `POST /api/auth`
//!
//! Issues a temporary session token for WebSocket connection.
//!
//! ## Request
//!
//! ```json
//! {
//!   "session_duration": 180  // Optional, defaults to server config
//! }
//! ```
//!
//! ## Response
//!
//! ```json
//! {
//!   "session_token": "uuid-v4-token",
//!   "session_time_limit": 180
//! }
//! ```
//!
//! ## Usage Flow
//!
//! 1. Client calls `POST /api/auth` to get a session token
//! 2. Client connects to `ws://server/ws?token={session_token}`
//! 3. Token is single-use and expires after 30 seconds

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

use crate::{error::Result, state::AppState};

/// Minimum allowed session duration (60 seconds)
const MIN_SESSION_DURATION: u64 = 60;
/// Maximum allowed session duration (10 minutes)
const MAX_SESSION_DURATION: u64 = 600;

#[derive(Deserialize, Default)]
pub struct AuthRequest {
    /// Custom session duration in seconds (optional)
    #[serde(default)]
    session_duration: Option<u64>,
}

#[derive(Serialize)]
pub struct AuthResponse {
    session_token: String,
    session_time_limit: u64,
}

/// Issue a temporary session token for WebSocket authentication.
pub async fn authenticate(
    State(state): State<AppState>,
    Json(request): Json<AuthRequest>,
) -> Result<Json<AuthResponse>> {
    // Use custom duration if provided and valid, otherwise use server default
    let session_duration = request
        .session_duration
        .map(|d| d.clamp(MIN_SESSION_DURATION, MAX_SESSION_DURATION))
        .unwrap_or(state.config.session_time_limit);

    let token = state.create_token(session_duration).await;

    tracing::info!("Issued new session token with duration: {}s", session_duration);

    Ok(Json(AuthResponse {
        session_token: token,
        session_time_limit: session_duration,
    }))
}
