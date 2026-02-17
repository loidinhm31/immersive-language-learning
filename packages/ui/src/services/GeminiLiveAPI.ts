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

    constructor(type: MultimodalLiveResponseTypeValue, data: GeminiResponse["data"] = "", endOfTurn: boolean = false) {
        this.type = type;
        this.data = data;
        this.endOfTurn = endOfTurn;
    }

    /**
     * Parse a raw message into one or more response messages.
     * A single backend message can contain multiple fields (e.g. turnComplete + outputTranscription),
     * so we emit a separate response for each to avoid silently dropping events.
     */
    static parseAll(rawData: Record<string, unknown>): MultimodalLiveResponseMessage[] {
        console.log("raw message data: ", rawData);
        const responses: MultimodalLiveResponseMessage[] = [];
        const endOfTurn = !!(rawData?.serverContent as Record<string, unknown>)?.turnComplete;

        const serverContent = rawData?.serverContent as Record<string, unknown> | undefined;
        const modelTurn = serverContent?.modelTurn as Record<string, unknown> | undefined;
        const parts = modelTurn?.parts as Array<Record<string, unknown>> | undefined;

        try {
            // Top-level exclusive types (error, sessionEnd, setupComplete, toolCall)
            if (rawData?.error) {
                const errorData = rawData.error as Record<string, unknown>;
                const statsData = errorData.stats as Record<string, unknown> | undefined;
                console.log("ERROR response", errorData);
                responses.push(
                    new MultimodalLiveResponseMessage(MultimodalLiveResponseType.ERROR, {
                        message: (errorData.message as string) || "Unknown error",
                        stats: statsData
                            ? {
                                  messageCount: (statsData.message_count as number) || 0,
                                  audioChunksSent: (statsData.audio_chunks_sent as number) || 0,
                                  elapsedSeconds: (statsData.elapsed_seconds as number) || 0,
                                  totalTokenCount: (statsData.total_token_count as number) || 0,
                                  promptTokenCount: (statsData.prompt_token_count as number) || 0,
                                  responseTokenCount: (statsData.response_token_count as number) || 0,
                              }
                            : undefined,
                    }),
                );
                return responses;
            }

            if (rawData?.sessionEnd) {
                const sessionData = rawData.sessionEnd as Record<string, unknown>;
                const statsData = sessionData.stats as Record<string, unknown> | undefined;
                console.log("SESSION END response", sessionData);
                responses.push(
                    new MultimodalLiveResponseMessage(
                        MultimodalLiveResponseType.SESSION_END,
                        statsData
                            ? {
                                  messageCount: (statsData.message_count as number) || 0,
                                  audioChunksSent: (statsData.audio_chunks_sent as number) || 0,
                                  elapsedSeconds: (statsData.elapsed_seconds as number) || 0,
                                  totalTokenCount: (statsData.total_token_count as number) || 0,
                                  promptTokenCount: (statsData.prompt_token_count as number) || 0,
                                  responseTokenCount: (statsData.response_token_count as number) || 0,
                              }
                            : {
                                  messageCount: 0,
                                  audioChunksSent: 0,
                                  elapsedSeconds: 0,
                                  totalTokenCount: 0,
                                  promptTokenCount: 0,
                                  responseTokenCount: 0,
                              },
                    ),
                );
                return responses;
            }

            if (rawData?.setupComplete) {
                console.log("SETUP COMPLETE response", rawData);
                responses.push(new MultimodalLiveResponseMessage(MultimodalLiveResponseType.SETUP_COMPLETE));
                return responses;
            }

            if (rawData?.toolCall) {
                console.log("TOOL CALL response", rawData?.toolCall);
                const sessionStatsRaw = rawData?.sessionStats as Record<string, unknown> | undefined;
                const toolCallData = rawData?.toolCall as ToolCallData;
                if (sessionStatsRaw) {
                    toolCallData.sessionStats = {
                        messageCount: (sessionStatsRaw.messageCount as number) || 0,
                        audioChunksSent: (sessionStatsRaw.audioChunksSent as number) || 0,
                        elapsedSeconds: (sessionStatsRaw.elapsedSeconds as number) || 0,
                        totalTokenCount: (sessionStatsRaw.totalTokenCount as number) || 0,
                        promptTokenCount: (sessionStatsRaw.promptTokenCount as number) || 0,
                        responseTokenCount: (sessionStatsRaw.responseTokenCount as number) || 0,
                    };
                }
                responses.push(new MultimodalLiveResponseMessage(MultimodalLiveResponseType.TOOL_CALL, toolCallData));
                return responses;
            }

            // serverContent fields — checked independently so none are dropped
            if (serverContent) {
                if (serverContent.inputTranscription) {
                    const inputTranscription = serverContent.inputTranscription as Record<string, unknown>;
                    console.log("INPUT TRANSCRIPTION:", inputTranscription);
                    responses.push(
                        new MultimodalLiveResponseMessage(MultimodalLiveResponseType.INPUT_TRANSCRIPTION, {
                            text: (inputTranscription.text as string) || "",
                            finished: (inputTranscription.finished as boolean) || false,
                        }),
                    );
                }

                if (serverContent.outputTranscription) {
                    const outputTranscription = serverContent.outputTranscription as Record<string, unknown>;
                    console.log("OUTPUT TRANSCRIPTION:", outputTranscription);
                    responses.push(
                        new MultimodalLiveResponseMessage(MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION, {
                            text: (outputTranscription.text as string) || "",
                            finished: (outputTranscription.finished as boolean) || false,
                        }),
                    );
                }

                if (parts?.length && parts[0].text) {
                    console.log("TEXT response", parts[0].text);
                    responses.push(
                        new MultimodalLiveResponseMessage(MultimodalLiveResponseType.TEXT, parts[0].text as string),
                    );
                }

                if (parts?.length && parts[0].inlineData) {
                    console.log("AUDIO response");
                    const inlineData = parts[0].inlineData as Record<string, unknown>;
                    responses.push(
                        new MultimodalLiveResponseMessage(MultimodalLiveResponseType.AUDIO, inlineData.data as string),
                    );
                }

                if (serverContent.generationComplete) {
                    console.log("GENERATION COMPLETE response");
                    responses.push(
                        new MultimodalLiveResponseMessage(
                            MultimodalLiveResponseType.GENERATION_COMPLETE,
                            "",
                            endOfTurn,
                        ),
                    );
                }

                if (serverContent.turnComplete) {
                    console.log("TURN COMPLETE response");
                    responses.push(
                        new MultimodalLiveResponseMessage(MultimodalLiveResponseType.TURN_COMPLETE, "", true),
                    );
                }

                if (serverContent.interrupted) {
                    console.log("INTERRUPTED response");
                    responses.push(new MultimodalLiveResponseMessage(MultimodalLiveResponseType.INTERRUPTED));
                }
            }

            // usageMetadata can co-exist with serverContent
            if (rawData?.usageMetadata) {
                const usage = rawData.usageMetadata as Record<string, unknown>;
                console.log("USAGE METADATA response", usage);
                responses.push(
                    new MultimodalLiveResponseMessage(MultimodalLiveResponseType.USAGE_METADATA, {
                        promptTokenCount: (usage.promptTokenCount as number) || 0,
                        responseTokenCount: (usage.responseTokenCount as number) || 0,
                        totalTokenCount: (usage.totalTokenCount as number) || 0,
                    }),
                );
            }
        } catch {
            console.log("Error parsing response data: ", rawData);
        }

        return responses;
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
        silence_duration_ms: 500,
        prefix_padding_ms: 50,
        end_of_speech_sensitivity: "END_SENSITIVITY_LOW",
        start_of_speech_sensitivity: "START_SENSITIVITY_LOW",
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

    async connect(token: string | null, sessionDuration?: number, jwtToken?: string, apiKey?: string): Promise<void> {
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
                    ...(apiKey && { api_key: apiKey }),
                }),
            });

            if (!response.ok) {
                const error = new Error("Authentication failed") as Error & { status: number };
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            const sessionToken = data.session_token;

            // 2. Connect WebSocket via qm-hub-server
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
        // Handle binary audio data
        if (messageEvent.data instanceof ArrayBuffer) {
            const message = new MultimodalLiveResponseMessage(MultimodalLiveResponseType.AUDIO, messageEvent.data);
            this.onReceiveResponse(message);
            return;
        }

        const messageData = JSON.parse(messageEvent.data);
        const responses = MultimodalLiveResponseMessage.parseAll(messageData);
        for (const response of responses) {
            this.onReceiveResponse(response);
        }
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

    sendToolResponse(functionName: string, toolCallId: string, response: unknown): void {
        const message = {
            tool_response: {
                function_responses: [
                    {
                        name: functionName,
                        id: toolCallId,
                        response: response,
                    },
                ],
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
