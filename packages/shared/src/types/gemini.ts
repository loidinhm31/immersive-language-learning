export const MultimodalLiveResponseType = {
    TEXT: "TEXT",
    AUDIO: "AUDIO",
    SETUP_COMPLETE: "SETUP COMPLETE",
    INTERRUPTED: "INTERRUPTED",
    TURN_COMPLETE: "TURN COMPLETE",
    TOOL_CALL: "TOOL_CALL",
    ERROR: "ERROR",
    SESSION_END: "SESSION_END",
    INPUT_TRANSCRIPTION: "INPUT_TRANSCRIPTION",
    OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",
    USAGE_METADATA: "USAGE_METADATA",
} as const;

export type MultimodalLiveResponseTypeValue =
    (typeof MultimodalLiveResponseType)[keyof typeof MultimodalLiveResponseType];

export interface TranscriptionData {
    text: string;
    finished: boolean;
}

export interface ToolCallData {
    functionCalls?: Array<{
        name: string;
        args: Record<string, unknown>;
        id?: string;
    }>;
    sessionStats?: SessionStats;
}

export interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
}

export interface SessionStats {
    messageCount: number;
    audioChunksSent: number;
    elapsedSeconds: number;
    totalTokenCount: number;
    promptTokenCount: number;
    candidatesTokenCount: number;
}

export interface ErrorData {
    message: string;
    stats?: SessionStats;
}

export interface GeminiResponse {
    type: MultimodalLiveResponseTypeValue;
    data: string | ArrayBuffer | TranscriptionData | ToolCallData | UsageMetadata | SessionStats | ErrorData;
    endOfTurn: boolean;
}

export interface GrammarCorrection {
    user_said: string;
    issue: string;
    correction: string;
}

export interface FunctionParameter {
    type: string;
    description?: string;
    items?: { type: string; properties?: Record<string, FunctionParameter>; required?: string[] };
    properties?: Record<string, FunctionParameter>;
}

export interface FunctionDefinitionSchema {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, FunctionParameter>;
        required?: string[];
    };
    requiredParameters?: string[];
}

export interface GeminiLiveConfig {
    responseModalities: string[];
    systemInstructions: string;
    voiceName: string;
    temperature: number;
    enableAffectiveDialog: boolean;
    inputAudioTranscription: boolean;
    outputAudioTranscription: boolean;
    enableFunctionCalls: boolean;
    proactivity: {
        proactiveAudio: boolean;
    };
    automaticActivityDetection: {
        disabled: boolean;
        silence_duration_ms: number;
        prefix_padding_ms: number;
        end_of_speech_sensitivity: string;
        start_of_speech_sensitivity: string;
    };
}

export interface CompleteMissionArgs {
    score: number;
    feedback_pointers: string[];
    grammar_corrections?: GrammarCorrection[];
    proficiency_observations?: string[];
    sessionStats?: SessionStats;
    tokenUsage?: UsageMetadata;
}
