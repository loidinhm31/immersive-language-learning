//! Error types for the server.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// Application error type.
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Authentication failed: {0}")]
    AuthError(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("Gemini API error: {0}")]
    GeminiError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Session expired")]
    SessionExpired,

    #[error("Invalid token")]
    InvalidToken,

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::AuthError(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token".to_string()),
            AppError::SessionExpired => (StatusCode::UNAUTHORIZED, "Session expired".to_string()),
            AppError::WebSocketError(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::GeminiError(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
            AppError::ConfigError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Internal(err) => (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()),
        };

        tracing::error!("Request error: {}", message);

        let body = Json(json!({
            "error": message
        }));

        (status, body).into_response()
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
