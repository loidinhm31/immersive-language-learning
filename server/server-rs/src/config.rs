//! Configuration module for server settings.
//!
//! Configuration is loaded from environment variables with sensible defaults.

use std::env;

/// Server configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct Config {
    /// Google Cloud Project ID (for Vertex AI auth)
    #[allow(dead_code)]
    pub project_id: Option<String>,

    /// GCP region for Vertex AI
    #[allow(dead_code)]
    pub location: String,

    /// Gemini model to use
    pub model: String,

    /// Google API Key for authentication
    /// Set either this OR use Application Default Credentials
    pub api_key: Option<String>,

    /// Server port
    pub port: u16,

    /// Maximum session duration in seconds
    pub session_time_limit: u64,

    /// Input audio sample rate (Hz)
    pub input_sample_rate: u32,
}

impl Config {
    /// Load configuration from environment variables.
    ///
    /// # Environment Variables
    ///
    /// | Variable | Description | Default |
    /// |----------|-------------|---------|
    /// | `GOOGLE_API_KEY` | API key for Gemini | None |
    /// | `PROJECT_ID` | GCP Project ID | None |
    /// | `LOCATION` | GCP region | `us-central1` |
    /// | `MODEL` | Gemini model name | `gemini-2.0-flash-live-001` |
    /// | `PORT` | Server port | `8000` |
    /// | `SESSION_TIME_LIMIT` | Max session seconds | `180` |
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            api_key: env::var("GOOGLE_API_KEY")
                .or_else(|_| env::var("GOOGLE_CLOUD_API_KEY"))
                .ok(),
            project_id: env::var("PROJECT_ID").ok(),
            location: env::var("LOCATION").unwrap_or_else(|_| "us-central1".to_string()),
            model: env::var("MODEL")
                .unwrap_or_else(|_| "gemini-2.0-flash-live-001".to_string()),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(8000),
            session_time_limit: env::var("SESSION_TIME_LIMIT")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(180),
            input_sample_rate: 16000,
        })
    }

    /// Build the Gemini Live API WebSocket URL.
    ///
    /// # Gemini Live API Endpoint
    ///
    /// The Live API uses WebSocket connections at:
    /// ```text
    /// wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent
    /// ```
    ///
    /// Query parameters:
    /// - `key`: API key for authentication
    ///
    /// Reference: <https://ai.google.dev/api/multimodal-live>
    pub fn gemini_ws_url(&self) -> anyhow::Result<String> {
        let api_key = self
            .api_key
            .as_ref()
            .ok_or_else(|| anyhow::anyhow!("GOOGLE_API_KEY is required"))?;

        Ok(format!(
            "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={}",
            api_key
        ))
    }
}
