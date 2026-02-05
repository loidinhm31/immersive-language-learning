//! # Gemini Live API Server (Rust)
//!
//! A high-performance Rust server that proxies WebSocket connections between
//! browser clients and Google's Gemini Live API.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────┐     WebSocket      ┌──────────────────┐
//! │  Browser/Client │◄──────────────────►│  Axum Server     │
//! └─────────────────┘   /ws endpoint     │  (this server)   │
//!                                        └────────┬─────────┘
//!                                                 │ tokio-tungstenite
//!                                                 ▼
//!                                        ┌──────────────────┐
//!                                        │  Gemini Live API │
//!                                        │  (WebSocket)     │
//!                                        └──────────────────┘
//! ```

mod config;
mod error;
mod gemini;
mod handlers;
mod state;

use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    // Default to info level; set RUST_LOG=server_rs=debug,tower_http=debug for debug logs
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "server_rs=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = config::Config::from_env()?;
    tracing::info!("Starting server with config: {:?}", config);

    // Create application state
    let state = AppState::new(config.clone());

    // Build router (backend-only, no static file serving)
    let app = Router::new()
        // API routes
        .route("/api/auth", post(handlers::auth::authenticate))
        .route("/api/health", get(handlers::health::health_check))
        // WebSocket endpoint
        .route("/ws", get(handlers::websocket::ws_handler))
        // Middleware
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
