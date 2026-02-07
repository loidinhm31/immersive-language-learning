//! Health check handler.
//!
//! # Endpoint: `GET /api/health`
//!
//! Returns server health status.
//!
//! ## Response
//!
//! ```json
//! {
//!   "status": "ok",
//!   "model": "gemini-2.0-flash-live-001"
//! }
//! ```

use axum::{extract::State, Json};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    status: &'static str,
    model: String,
}

pub async fn health_check(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        model: state.config.model.clone(),
    })
}
