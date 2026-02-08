import {
    MultimodalLiveResponseType,
    type GeminiResponse,
    type MultimodalLiveResponseTypeValue,
    type TranscriptionData,
    type ToolCallData,
    type UsageMetadata,
    type SessionStats,
    type ErrorData,
    type FunctionDefinitionSchema,
    type GeminiLiveConfig,
} from "@immersive-lang/shared";
import { API_ENDPOINTS, DEFAULT_VOICE, DEFAULT_TEMPERATURE, env } from "@immersive-lang/shared";

/**
 * Parses response messages from the Gemini Live API
 */
export class MultimodalLiveResponseMessage implements GeminiResponse {
    data: string | ArrayBuffer | TranscriptionData | ToolCallData | UsageMetadata | SessionStats | ErrorData = "";
    type: MultimodalLiveResponseTypeValue = "" as MultimodalLiveResponseTypeValue;
    endOfTurn: boolean = false;

    constructor(rawData: Record<string, unknown>) {
        console.log("raw message data: ", rawData);
        this.endOfTurn = !!(rawData?.serverContent as Record<string, unknown>)?.turnComplete;

        const serverContent = rawData?.serverContent as Record<string, unknown> | undefined;
        const modelTurn = serverContent?.modelTurn as Record<string, unknown> | undefined;
        const parts = modelTurn?.parts as Array<Record<string, unknown>> | undefined;

        try {
            if (rawData?.error) {
                const errorData = rawData.error as Record<string, unknown>;
                const statsData = errorData.stats as Record<string, unknown> | undefined;
                console.log("❌ ERROR response", errorData);
                this.type = MultimodalLiveResponseType.ERROR;
                this.data = {
                    message: (errorData.message as string) || "Unknown error",
                    stats: statsData
                        ? {
                              messageCount: (statsData.message_count as number) || 0,
                              audioChunksSent: (statsData.audio_chunks_sent as number) || 0,
                              elapsedSeconds: (statsData.elapsed_seconds as number) || 0,
                              totalTokenCount: (statsData.total_token_count as number) || 0,
                              promptTokenCount: (statsData.prompt_token_count as number) || 0,
                              candidatesTokenCount: (statsData.candidates_token_count as number) || 0,
                          }
                        : undefined,
                };
            } else if (rawData?.sessionEnd) {
                const sessionData = rawData.sessionEnd as Record<string, unknown>;
                const statsData = sessionData.stats as Record<string, unknown> | undefined;
                console.log("🏁 SESSION END response", sessionData);
                this.type = MultimodalLiveResponseType.SESSION_END;
                this.data = statsData
                    ? {
                          messageCount: (statsData.message_count as number) || 0,
                          audioChunksSent: (statsData.audio_chunks_sent as number) || 0,
                          elapsedSeconds: (statsData.elapsed_seconds as number) || 0,
                          totalTokenCount: (statsData.total_token_count as number) || 0,
                          promptTokenCount: (statsData.prompt_token_count as number) || 0,
                          candidatesTokenCount: (statsData.candidates_token_count as number) || 0,
                      }
                    : {
                          messageCount: 0,
                          audioChunksSent: 0,
                          elapsedSeconds: 0,
                          totalTokenCount: 0,
                          promptTokenCount: 0,
                          candidatesTokenCount: 0,
                      };
            } else if (rawData?.setupComplete) {
                console.log("🏁 SETUP COMPLETE response", rawData);
                this.type = MultimodalLiveResponseType.SETUP_COMPLETE;
            } else if (serverContent?.turnComplete) {
                console.log("🏁 TURN COMPLETE response");
                this.type = MultimodalLiveResponseType.TURN_COMPLETE;
            } else if (serverContent?.interrupted) {
                console.log("🗣️ INTERRUPTED response");
                this.type = MultimodalLiveResponseType.INTERRUPTED;
            } else if (serverContent?.inputTranscription) {
                const inputTranscription = serverContent.inputTranscription as Record<string, unknown>;
                console.log("📝 INPUT TRANSCRIPTION:", inputTranscription);
                this.type = MultimodalLiveResponseType.INPUT_TRANSCRIPTION;
                this.data = {
                    text: (inputTranscription.text as string) || "",
                    finished: (inputTranscription.finished as boolean) || false,
                };
            } else if (serverContent?.outputTranscription) {
                const outputTranscription = serverContent.outputTranscription as Record<string, unknown>;
                console.log("📝 OUTPUT TRANSCRIPTION:", outputTranscription);
                this.type = MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION;
                this.data = {
                    text: (outputTranscription.text as string) || "",
                    finished: (outputTranscription.finished as boolean) || false,
                };
            } else if (rawData?.toolCall) {
                console.log("🎯 🛠️ TOOL CALL response", rawData?.toolCall);
                const sessionStatsRaw = rawData?.sessionStats as Record<string, unknown> | undefined;
                const toolCallData = rawData?.toolCall as ToolCallData;
                if (sessionStatsRaw) {
                    toolCallData.sessionStats = {
                        messageCount: (sessionStatsRaw.messageCount as number) || 0,
                        audioChunksSent: (sessionStatsRaw.audioChunksSent as number) || 0,
                        elapsedSeconds: (sessionStatsRaw.elapsedSeconds as number) || 0,
                        totalTokenCount: (sessionStatsRaw.totalTokenCount as number) || 0,
                        promptTokenCount: (sessionStatsRaw.promptTokenCount as number) || 0,
                        candidatesTokenCount: (sessionStatsRaw.candidatesTokenCount as number) || 0,
                    };
                }
                this.type = MultimodalLiveResponseType.TOOL_CALL;
                this.data = toolCallData;
            } else if (rawData?.usageMetadata) {
                const usage = rawData.usageMetadata as Record<string, unknown>;
                console.log("📊 USAGE METADATA response", usage);
                this.type = MultimodalLiveResponseType.USAGE_METADATA;
                this.data = {
                    promptTokenCount: (usage.promptTokenCount as number) || 0,
                    candidatesTokenCount: (usage.candidatesTokenCount as number) || 0,
                    totalTokenCount: (usage.totalTokenCount as number) || 0,
                };
            } else if (parts?.length && parts[0].text) {
                console.log("💬 TEXT response", parts[0].text);
                this.data = parts[0].text as string;
                this.type = MultimodalLiveResponseType.TEXT;
            } else if (parts?.length && parts[0].inlineData) {
                console.log("🔊 AUDIO response");
                const inlineData = parts[0].inlineData as Record<string, unknown>;
                this.data = inlineData.data as string;
                this.type = MultimodalLiveResponseType.AUDIO;
            }
        } catch {
            console.log("⚠️ Error parsing response data: ", rawData);
        }
    }
}

/**
 * Function call definition for tool use
 */
export class FunctionCallDefinition {
    name: string;
    description: string;
    parameters: FunctionDefinitionSchema["parameters"];
    requiredParameters: string[];
    functionToCall: (parameters: Record<string, unknown>) => void;

    constructor(
        name: string,
        description: string,
        parameters: FunctionDefinitionSchema["parameters"],
        requiredParameters: string[] = [],
    ) {
        this.name = name;
        this.description = description;
        this.parameters = parameters;
        this.requiredParameters = requiredParameters;
        this.functionToCall = () => {
            console.log("▶️Default function call");
        };
    }

    getDefinition(): FunctionDefinitionSchema {
        const definition: FunctionDefinitionSchema = {
            name: this.name,
            description: this.description,
            parameters: {
                ...this.parameters,
                required: this.requiredParameters,
            },
        };
        console.log("created FunctionDefinition: ", definition);
        return definition;
    }

    runFunction(parameters: Record<string, unknown>): void {
        console.log(`⚡ Running ${this.name} function with parameters: ${JSON.stringify(parameters)}`);
        this.functionToCall(parameters);
    }
}

/**
 * Main Gemini Live API client
 */
export class GeminiLiveAPI {
    // Configuration
    responseModalities: string[] = ["AUDIO"];
    systemInstructions: string = "";
    googleGrounding: boolean = false;
    enableAffectiveDialog: boolean = true;
    voiceName: string = DEFAULT_VOICE;
    temperature: number = DEFAULT_TEMPERATURE;
    proactivity: { proactiveAudio: boolean } = { proactiveAudio: true };
    inputAudioTranscription: boolean = false;
    outputAudioTranscription: boolean = false;
    enableFunctionCalls: boolean = false;
    automaticActivityDetection: GeminiLiveConfig["automaticActivityDetection"] = {
        disabled: false,
        silence_duration_ms: 2000,
        prefix_padding_ms: 500,
        end_of_speech_sensitivity: "END_SENSITIVITY_UNSPECIFIED",
        start_of_speech_sensitivity: "START_SENSITIVITY_UNSPECIFIED",
    };

    // State
    connected: boolean = false;
    private webSocket: WebSocket | null = null;
    private functions: FunctionCallDefinition[] = [];
    private functionsMap: Record<string, FunctionCallDefinition> = {};
    private totalBytesSent: number = 0;

    // Callbacks
    onReceiveResponse: (message: GeminiResponse) => void = (message) => {
        console.log("Default message received callback", message);
    };
    onConnectionStarted: () => void = () => {
        console.log("Default onConnectionStarted");
    };
    onErrorMessage: (message: string) => void = (message) => {
        console.error("❌ [GeminiLiveAPI] Error:", message);
        this.connected = false;
    };
    onOpen: () => void = () => {};
    onClose: (event?: CloseEvent) => void = () => {};
    onError: (event?: Event) => void = () => {};

    constructor() {
        console.log("Created Gemini Live API object");
    }

    setSystemInstructions(newSystemInstructions: string): void {
        console.log("setting system instructions: ", newSystemInstructions);
        this.systemInstructions = newSystemInstructions;
    }

    setGoogleGrounding(newGoogleGrounding: boolean): void {
        console.log("setting google grounding: ", newGoogleGrounding);
        this.googleGrounding = newGoogleGrounding;
    }

    setResponseModalities(modalities: string[]): void {
        this.responseModalities = modalities;
    }

    setVoice(voiceName: string): void {
        console.log("setting voice: ", voiceName);
        this.voiceName = voiceName;
    }

    setProactivity(proactivity: { proactiveAudio: boolean }): void {
        console.log("setting proactivity: ", proactivity);
        this.proactivity = proactivity;
    }

    setInputAudioTranscription(enabled: boolean): void {
        console.log("setting input audio transcription: ", enabled);
        this.inputAudioTranscription = enabled;
    }

    setOutputAudioTranscription(enabled: boolean): void {
        console.log("setting output audio transcription: ", enabled);
        this.outputAudioTranscription = enabled;
    }

    setEnableFunctionCalls(enabled: boolean): void {
        console.log("setting enable function calls: ", enabled);
        this.enableFunctionCalls = enabled;
    }

    addFunction(newFunction: FunctionCallDefinition): void {
        this.functions.push(newFunction);
        this.functionsMap[newFunction.name] = newFunction;
        console.log("added function: ", newFunction);
    }

    callFunction(functionName: string, parameters: Record<string, unknown>): void {
        const functionToCall = this.functionsMap[functionName];
        if (functionToCall) {
            functionToCall.runFunction(parameters);
        }
    }

    async connect(token: string | null, sessionDuration?: number, jwtToken?: string): Promise<void> {
        try {
            // 1. Authenticate
            const baseUrl = env.apiBaseUrl;
            const authUrl = `${baseUrl}${API_ENDPOINTS.AUTH}`;

            console.log("🔗 Connecting to:", authUrl);

            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (jwtToken) {
                headers["Authorization"] = `Bearer ${jwtToken}`;
            }

            const response = await fetch(authUrl, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    ...(sessionDuration && { session_duration: sessionDuration }),
                }),
            });

            if (!response.ok) {
                const error = new Error("Authentication failed") as Error & { status: number };
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            const sessionToken = data.session_token;

            // 2. Connect WebSocket via qm-center-server
            const wsProtocol = baseUrl.startsWith("https") ? "wss:" : "ws:";
            const wsHost = baseUrl.replace(/^https?:\/\//, "");
            const wsUrl = `${wsProtocol}//${wsHost}${API_ENDPOINTS.WEBSOCKET}?token=${sessionToken}`;

            this.setupWebSocketToService(wsUrl);
        } catch (error) {
            console.error("Connection error:", error);
            throw error;
        }
    }

    disconnect(): void {
        if (this.webSocket) {
            this.webSocket.close();
            this.connected = false;
        }
    }

    sendMessage(message: Record<string, unknown>): void {
        console.log("🟩 Sending message: ", message);
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            this.webSocket.send(JSON.stringify(message));
        }
    }

    private onReceiveMessage(messageEvent: MessageEvent): void {
        console.log("Message received: ", messageEvent);

        // Handle binary audio data
        if (messageEvent.data instanceof ArrayBuffer) {
            const message = new MultimodalLiveResponseMessage({
                serverContent: {
                    modelTurn: {
                        parts: [{ inlineData: { data: messageEvent.data } }],
                    },
                },
            });
            message.type = MultimodalLiveResponseType.AUDIO;
            message.data = messageEvent.data;
            this.onReceiveResponse(message);
            return;
        }

        const messageData = JSON.parse(messageEvent.data);
        const message = new MultimodalLiveResponseMessage(messageData);
        this.onReceiveResponse(message);
    }

    private setupWebSocketToService(url: string): void {
        console.log("connecting: ", url);

        this.webSocket = new WebSocket(url);
        this.webSocket.binaryType = "arraybuffer";

        this.webSocket.onclose = (event: CloseEvent) => {
            console.log("websocket closed: ", event);
            this.connected = false;
            this.onClose(event);
        };

        this.webSocket.onerror = (event: Event) => {
            console.log("websocket error: ", event);
            this.connected = false;
            this.onError(event);
        };

        this.webSocket.onopen = () => {
            console.log("websocket open");
            this.connected = true;
            this.totalBytesSent = 0;
            this.sendInitialSetupMessages();
            this.onConnectionStarted();
            this.onOpen();
        };

        this.webSocket.onmessage = this.onReceiveMessage.bind(this);
    }

    private getFunctionDefinitions(): FunctionDefinitionSchema[] {
        console.log("🛠️ getFunctionDefinitions called");
        return this.functions.map((func) => func.getDefinition());
    }

    private sendInitialSetupMessages(): void {
        const tools = this.getFunctionDefinitions();

        const sessionSetupMessage: Record<string, unknown> = {
            setup: {
                generation_config: {
                    response_modalities: this.responseModalities,
                    temperature: this.temperature,
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: this.voiceName,
                            },
                        },
                    },
                },
                system_instruction: { parts: [{ text: this.systemInstructions }] },
                tools: { function_declarations: tools },
                proactivity: this.proactivity,
                realtime_input_config: {
                    automatic_activity_detection: this.automaticActivityDetection,
                },
            },
        };

        const setup = sessionSetupMessage.setup as Record<string, unknown>;

        // Add transcription config if enabled
        if (this.inputAudioTranscription) {
            setup.input_audio_transcription = {};
        }
        if (this.outputAudioTranscription) {
            setup.output_audio_transcription = {};
        }

        if (this.googleGrounding) {
            (setup.tools as Record<string, unknown>).google_search = {};
            console.log("Google Grounding enabled, removing custom function calls if any.");
            delete (setup.tools as Record<string, unknown>).function_declarations;
        }

        // Add affective dialog if enabled
        if (this.enableAffectiveDialog) {
            (setup.generation_config as Record<string, unknown>).enable_affective_dialog = true;
        }

        console.log("sessionSetupMessage: ", sessionSetupMessage);
        this.sendMessage(sessionSetupMessage);
    }

    sendTextMessage(text: string): void {
        const textMessage = {
            client_content: {
                turns: [
                    {
                        role: "user",
                        parts: [{ text: text }],
                    },
                ],
                turn_complete: true,
            },
        };
        this.sendMessage(textMessage);
    }

    sendToolResponse(toolCallId: string, response: unknown): void {
        const message = {
            tool_response: {
                id: toolCallId,
                response: response,
            },
        };
        console.log("🔧 Sending tool response:", message);
        this.sendMessage(message);
    }

    sendAudioMessage(pcmData: ArrayBuffer): void {
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            this.webSocket.send(pcmData);
            this.totalBytesSent += pcmData.byteLength;
        }
    }

    getBytesSent(): number {
        return this.totalBytesSent;
    }
}
