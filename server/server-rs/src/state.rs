//! Application state management.
//!
//! Handles session tokens and shared configuration.

use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::sync::RwLock;

use crate::config::Config;

/// Token expiry duration (30 seconds, matching Python implementation).
const TOKEN_EXPIRY_SECONDS: u64 = 30;

/// Session token with creation timestamp and custom duration.
#[derive(Debug, Clone)]
pub struct SessionToken {
    created_at: Instant,
    /// Custom session duration in seconds
    pub duration: u64,
}

impl SessionToken {
    pub fn new(duration: u64) -> Self {
        Self {
            created_at: Instant::now(),
            duration,
        }
    }

    pub fn is_expired(&self) -> bool {
        self.created_at.elapsed() > Duration::from_secs(TOKEN_EXPIRY_SECONDS)
    }
}

/// Shared application state.
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    /// Valid session tokens (token string -> SessionToken)
    tokens: Arc<RwLock<HashMap<String, SessionToken>>>,
}

impl AppState {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            tokens: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new session token with a custom duration.
    ///
    /// Returns the token string that the client should use to connect to the WebSocket.
    pub async fn create_token(&self, duration: u64) -> String {
        let token = uuid::Uuid::new_v4().to_string();
        let mut tokens = self.tokens.write().await;

        // Cleanup expired tokens
        tokens.retain(|_, t| !t.is_expired());

        // Insert new token with custom duration
        tokens.insert(token.clone(), SessionToken::new(duration));

        token
    }

    /// Validate and consume a token (one-time use).
    ///
    /// Returns `Some(duration)` if the token was valid and has been consumed,
    /// where duration is the session time limit in seconds.
    pub async fn consume_token(&self, token: &str) -> Option<u64> {
        let mut tokens = self.tokens.write().await;

        if let Some(session_token) = tokens.remove(token) {
            if !session_token.is_expired() {
                Some(session_token.duration)
            } else {
                None
            }
        } else {
            None
        }
    }
}
