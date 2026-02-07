use axum::{extract::State, Json};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct StatusResponse {
    status: &'static str,
    mode: &'static str,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    missing: Vec<String>,
}

pub async fn check_status(State(state): State<AppState>) -> Json<StatusResponse> {
    let mut missing = Vec::new();

    // Check for critical configuration
    if state.config.api_key.is_none() {
        missing.push("GOOGLE_API_KEY".to_string());
    }

    // If we have the API key, we are in "advanced" mode (securely proxying requests)
    // otherwise "simple" mode where the client might need to provide it.
    let mode = if missing.is_empty() { "advanced" } else { "simple" };

    Json(StatusResponse {
        status: "ok",
        mode,
        missing,
    })
}
