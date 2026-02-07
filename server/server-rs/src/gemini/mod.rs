//! Gemini Live API Client
//!
//! This module handles the WebSocket connection to Google's Gemini Live API.
//!
//! # Gemini Live API Protocol
//!
//! ## Endpoint
//!
//! ```text
//! wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={API_KEY}
//! ```
//!
//! ## Authentication
//!
//! - **API Key**: Pass as query parameter `key={API_KEY}`
//! - **Vertex AI**: Use OAuth2 bearer token (not implemented here)
//!
//! ## Message Format
//!
//! All messages are JSON. Audio is base64-encoded within the JSON payload.
//!
//! ### Setup Message (Client → Gemini)
//!
//! ```json
//! {
//!   "setup": {
//!     "model": "models/gemini-2.0-flash-live-001",
//!     "generationConfig": {
//!       "responseModalities": ["AUDIO"],
//!       "speechConfig": {
//!         "voiceConfig": {
//!           "prebuiltVoiceConfig": {
//!             "voiceName": "Aoede"
//!           }
//!         }
//!       }
//!     },
//!     "systemInstruction": {
//!       "parts": [{ "text": "You are a helpful assistant." }]
//!     }
//!   }
//! }
//! ```
//!
//! ### Realtime Input (Client → Gemini)
//!
//! ```json
//! {
//!   "realtimeInput": {
//!     "mediaChunks": [{
//!       "mimeType": "audio/pcm;rate=16000",
//!       "data": "<base64-encoded-pcm>"
//!     }]
//!   }
//! }
//! ```
//!
//! ### Server Response (Gemini → Client)
//!
//! ```json
//! {
//!   "serverContent": {
//!     "modelTurn": {
//!       "parts": [{
//!         "inlineData": {
//!           "mimeType": "audio/pcm;rate=24000",
//!           "data": "<base64-encoded-pcm>"
//!         }
//!       }]
//!     }
//!   }
//! }
//! ```
//!
//! ## Audio Format
//!
//! | Direction | Format |
//! |-----------|--------|
//! | Input | 16-bit PCM, 16kHz, mono |
//! | Output | 16-bit PCM, 24kHz, mono |
//!
//! # References
//!
//! - [Gemini Live API Docs](https://ai.google.dev/api/multimodal-live)
//! - [Audio Format Guide](https://ai.google.dev/api/multimodal-live#audio)

mod client;
mod messages;

pub use client::GeminiLiveClient;
