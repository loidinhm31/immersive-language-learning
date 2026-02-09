//! Message types for Gemini Live API.
//!
//! These structures match the Gemini Live API JSON schema.
//! Note: The Gemini Live API uses snake_case for field names.

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};

/// Setup message sent when establishing a session.
#[derive(Debug, Serialize)]
pub struct SetupMessage {
    pub setup: SetupConfig,
}

#[derive(Debug, Serialize)]
pub struct SetupConfig {
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generation_config: Option<GenerationConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_instruction: Option<Content>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Tool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window_compression: Option<ContextWindowCompression>,
}

#[derive(Debug, Serialize)]
pub struct ContextWindowCompression {
    pub trigger_tokens: u32,
    pub sliding_window: SlidingWindow,
}

#[derive(Debug, Serialize)]
pub struct SlidingWindow {
    pub target_tokens: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerationConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_modalities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speech_config: Option<SpeechConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpeechConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voice_config: Option<VoiceConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VoiceConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prebuilt_voice_config: Option<PrebuiltVoiceConfig>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrebuiltVoiceConfig {
    pub voice_name: String,
}

/// Content for sending to Gemini (snake_case)
#[derive(Debug, Serialize, Deserialize)]
pub struct Content {
    pub parts: Vec<InputPart>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
}

/// Part for sending to Gemini (snake_case)
#[derive(Debug, Serialize, Deserialize)]
pub struct InputPart {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inline_data: Option<InputBlob>,
}

/// Blob for sending to Gemini (snake_case)
#[derive(Debug, Serialize, Deserialize)]
pub struct InputBlob {
    pub mime_type: String,
    pub data: String, // Base64 encoded
}

/// Part from Gemini response (camelCase)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponsePart {
    #[serde(default)]
    pub text: Option<String>,
    #[serde(default)]
    pub inline_data: Option<ResponseBlob>,
}

/// Blob from Gemini response (camelCase)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseBlob {
    pub mime_type: String,
    pub data: String, // Base64 encoded
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tool {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_declarations: Option<Vec<FunctionDeclaration>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FunctionDeclaration {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<serde_json::Value>,
}

/// Realtime audio input message.
#[derive(Debug, Serialize)]
pub struct RealtimeInputMessage {
    pub realtime_input: RealtimeInput,
}

#[derive(Debug, Serialize)]
pub struct RealtimeInput {
    /// Audio blob for realtime input
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audio: Option<InputBlob>,
    /// Video blob for realtime input
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video: Option<InputBlob>,
}

impl RealtimeInput {
    /// Create a realtime input with audio data.
    pub fn audio_pcm(data: &[u8], sample_rate: u32) -> Self {
        Self {
            audio: Some(InputBlob {
                mime_type: format!("audio/pcm;rate={}", sample_rate),
                data: BASE64.encode(data),
            }),
            video: None,
        }
    }
}

/// Text input message.
#[derive(Debug, Serialize)]
pub struct ClientContentMessage {
    pub client_content: ClientContent,
}

#[derive(Debug, Serialize)]
pub struct ClientContent {
    pub turns: Vec<Content>,
    pub turn_complete: bool,
}

/// Server response message.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerMessage {
    #[serde(default)]
    pub setup_complete: Option<serde_json::Value>,
    #[serde(default)]
    pub server_content: Option<ServerContent>,
    #[serde(default)]
    pub tool_call: Option<ToolCall>,
    #[serde(default)]
    pub usage_metadata: Option<UsageMetadata>,
}

/// Token usage metadata from Gemini API.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageMetadata {
    #[serde(default)]
    pub prompt_token_count: Option<u32>,
    #[serde(default)]
    pub response_token_count: Option<u32>,
    #[serde(default)]
    pub total_token_count: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerContent {
    #[serde(default)]
    pub model_turn: Option<ModelTurn>,
    #[serde(default)]
    pub input_transcription: Option<Transcription>,
    #[serde(default)]
    pub output_transcription: Option<Transcription>,
    #[serde(default)]
    pub turn_complete: Option<bool>,
    #[serde(default)]
    pub interrupted: Option<bool>,
    #[serde(default)]
    pub generation_complete: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelTurn {
    pub parts: Vec<ResponsePart>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transcription {
    pub text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCall {
    pub function_calls: Vec<FunctionCall>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FunctionCall {
    pub name: String,
    pub id: String,
    #[serde(default)]
    pub args: Option<serde_json::Value>,
}

/// Tool response message (for sending function call responses back to Gemini).
#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct ToolResponseMessage {
    pub tool_response: ToolResponse,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct ToolResponse {
    pub function_responses: Vec<FunctionResponse>,
}

#[derive(Debug, Serialize)]
#[allow(dead_code)]
pub struct FunctionResponse {
    pub name: String,
    pub id: String,
    pub response: serde_json::Value,
}

/// Events forwarded to the browser client.
/// Note: These use camelCase because the browser client expects camelCase.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientEventMessage {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub server_content: Option<ClientServerContent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call: Option<ClientToolCall>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage_metadata: Option<ClientUsageMetadata>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_stats: Option<ClientSessionStats>,
}

/// Session stats snapshot forwarded with tool calls.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientSessionStats {
    pub message_count: u64,
    pub audio_chunks_sent: u64,
    pub elapsed_seconds: f64,
}

/// Token usage metadata for browser client (camelCase).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientUsageMetadata {
    pub prompt_token_count: u32,
    pub response_token_count: u32,
    pub total_token_count: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientServerContent {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_transcription: Option<ClientTranscription>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_transcription: Option<ClientTranscription>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub turn_complete: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interrupted: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientTranscription {
    pub text: String,
    pub finished: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientToolCall {
    pub function_calls: Vec<ClientFunctionCall>,
}

/// Function call for browser client (camelCase)
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientFunctionCall {
    pub name: String,
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub args: Option<serde_json::Value>,
}

impl From<FunctionCall> for ClientFunctionCall {
    fn from(fc: FunctionCall) -> Self {
        Self {
            name: fc.name,
            id: fc.id,
            args: fc.args,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_audio_response() {
        // Sample response from Gemini Live API (camelCase)
        let json = r#"{
            "serverContent": {
                "modelTurn": {
                    "parts": [{
                        "inlineData": {
                            "mimeType": "audio/pcm;rate=24000",
                            "data": "AAAA"
                        }
                    }]
                }
            }
        }"#;

        let msg: ServerMessage = serde_json::from_str(json).expect("Failed to parse");

        assert!(msg.server_content.is_some(), "server_content should be Some");

        let server_content = msg.server_content.unwrap();
        assert!(server_content.model_turn.is_some(), "model_turn should be Some");

        let model_turn = server_content.model_turn.unwrap();
        assert_eq!(model_turn.parts.len(), 1, "Should have 1 part");

        let part = &model_turn.parts[0];
        assert!(part.inline_data.is_some(), "inline_data should be Some");

        let inline_data = part.inline_data.as_ref().unwrap();
        assert_eq!(inline_data.mime_type, "audio/pcm;rate=24000");
        assert_eq!(inline_data.data, "AAAA");

        println!("✅ Audio response parsing works correctly!");
    }

    #[test]
    fn test_parse_setup_complete() {
        let json = r#"{"setupComplete": {}}"#;
        let msg: ServerMessage = serde_json::from_str(json).expect("Failed to parse");
        assert!(msg.setup_complete.is_some());
        println!("✅ Setup complete parsing works!");
    }

    #[test]
    fn test_parse_transcription() {
        let json = r#"{
            "serverContent": {
                "outputTranscription": {
                    "text": "Hello world"
                }
            }
        }"#;
        let msg: ServerMessage = serde_json::from_str(json).expect("Failed to parse");
        assert!(msg.server_content.is_some());
        let content = msg.server_content.unwrap();
        assert!(content.output_transcription.is_some());
        assert_eq!(content.output_transcription.unwrap().text, "Hello world");
        println!("✅ Transcription parsing works!");
    }
}
