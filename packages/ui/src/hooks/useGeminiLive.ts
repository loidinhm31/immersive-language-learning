import { useState, useCallback, useRef, useEffect } from "react";
import { GeminiLiveAPI, FunctionCallDefinition, AudioStreamer, AudioPlayer } from "@immersive-lang/ui/services";
import {
    MultimodalLiveResponseType,
    type GeminiResponse,
    type TranscriptionData,
    type ToolCallData,
    type UsageMetadata,
    type SessionStats,
    type ErrorData,
    type CompleteMissionArgs,
    AUTH_STORAGE_KEYS,
    GEMINI_STORAGE_KEYS,
    decryptFromStorage,
} from "@immersive-lang/shared";

export interface SessionError {
    message: string;
    stats?: SessionStats;
    status?: number;
}

export interface UseGeminiLiveOptions {
    onTranscriptInput?: (text: string, finished: boolean) => void;
    onTranscriptOutput?: (text: string, finished: boolean) => void;
    onTurnComplete?: () => void;
    onMissionComplete?: (args: CompleteMissionArgs) => void;
    onError?: (error: SessionError) => void;
    onSessionEnd?: (stats: SessionStats) => void;
}

export interface UseGeminiLiveReturn {
    isConnected: boolean;
    isConnecting: boolean;
    connect: (
        systemInstructions: string,
        inputTranscription: boolean,
        outputTranscription: boolean,
        sessionDuration?: number,
        voice?: string,
        jwtToken?: string,
        customTools?: FunctionCallDefinition[],
    ) => Promise<void>;
    disconnect: () => void;
    audioContext: AudioContext | null;
    audioSource: MediaStreamAudioSourceNode | null;
    playerAudioContext: AudioContext | null;
    playerGainNode: GainNode | null;
    remainingTime: number | null;
    sessionDuration: number | null;
    tokenUsage: UsageMetadata | null;
    sessionStats: SessionStats | null;
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
    const { onTranscriptInput, onTranscriptOutput, onTurnComplete, onMissionComplete, onError, onSessionEnd } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioSource, setAudioSource] = useState<MediaStreamAudioSourceNode | null>(null);
    const [playerAudioContext, setPlayerAudioContext] = useState<AudioContext | null>(null);
    const [playerGainNode, setPlayerGainNode] = useState<GainNode | null>(null);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [sessionDuration, setSessionDuration] = useState<number | null>(null);
    const [tokenUsage, setTokenUsage] = useState<UsageMetadata | null>(null);
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

    const clientRef = useRef<GeminiLiveAPI | null>(null);
    const audioStreamerRef = useRef<AudioStreamer | null>(null);
    const audioPlayerRef = useRef<AudioPlayer | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tokenUsageRef = useRef<UsageMetadata | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (audioStreamerRef.current) {
                audioStreamerRef.current.stop();
            }
            if (clientRef.current) {
                clientRef.current.disconnect();
            }
            if (audioPlayerRef.current) {
                audioPlayerRef.current.destroy();
            }
        };
    }, []);

    const connect = useCallback(
        async (
            systemInstructions: string,
            inputTranscription: boolean,
            outputTranscription: boolean,
            sessionDuration?: number,
            voice?: string,
            jwtToken?: string,
            customTools?: FunctionCallDefinition[],
        ) => {
            if (isConnecting || isConnected) return;

            setIsConnecting(true);

            try {
                // Initialize client
                const client = new GeminiLiveAPI();
                clientRef.current = client;

                // Initialize audio streamer and player
                // Resolve worklet URL relative to current origin to handle Tauri/Vite paths correctly
                const workletUrl = new URL("/audio-processors/capture.worklet.js", window.location.origin).toString();
                const streamer = new AudioStreamer(client, workletUrl);
                audioStreamerRef.current = streamer;

                const playerWorkletUrl = new URL(
                    "/audio-processors/playback.worklet.js",
                    window.location.origin,
                ).toString();
                const player = new AudioPlayer(playerWorkletUrl);
                audioPlayerRef.current = player;

                // Configure client
                client.setSystemInstructions(systemInstructions);
                client.setInputAudioTranscription(inputTranscription);
                client.setOutputAudioTranscription(outputTranscription);
                if (voice) {
                    client.setVoice(voice);
                }

                // Register tools - use custom tools if provided, otherwise default complete_mission
                if (customTools && customTools.length > 0) {
                    customTools.forEach((tool) => client.addFunction(tool));
                } else {
                    const completeMissionTool = new FunctionCallDefinition(
                        "complete_mission",
                        "Call this tool when the user has successfully completed the mission objective. Include grammar corrections and proficiency observations.",
                        {
                            type: "OBJECT",
                            properties: {
                                score: {
                                    type: "INTEGER",
                                    description: "Rating from 1 to 3 based on performance",
                                },
                                feedback_pointers: {
                                    type: "ARRAY",
                                    items: { type: "STRING" },
                                    description: "List of 3 constructive feedback points",
                                },
                                grammar_corrections: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            user_said: {
                                                type: "STRING",
                                                description: "What the user actually said (the incorrect phrase)",
                                            },
                                            issue: {
                                                type: "STRING",
                                                description: "Brief explanation of the grammar or vocabulary issue",
                                            },
                                            correction: {
                                                type: "STRING",
                                                description: "The correct form of the phrase",
                                            },
                                        },
                                        required: ["user_said", "issue", "correction"],
                                    },
                                    description:
                                        "List of specific grammar or vocabulary errors the user made during the session",
                                },
                                proficiency_observations: {
                                    type: "ARRAY",
                                    items: { type: "STRING" },
                                    description: "List of 2-4 general observations about the user proficiency level",
                                },
                            },
                        },
                        ["score", "feedback_pointers"],
                    );

                    completeMissionTool.functionToCall = (args: Record<string, unknown>) => {
                        if (onMissionComplete) {
                            onMissionComplete(args as unknown as CompleteMissionArgs);
                        }
                    };

                    client.addFunction(completeMissionTool);
                }

                // Set up response handler
                client.onReceiveResponse = (response: GeminiResponse) => {
                    if (response.type === MultimodalLiveResponseType.ERROR) {
                        const errorData = response.data as ErrorData;
                        console.error("❌ [Gemini] Error received:", errorData.message, "Stats:", errorData.stats);
                        // Stop audio streaming and disconnect
                        audioStreamerRef.current?.stop();
                        audioPlayerRef.current?.interrupt();
                        // Clear timer
                        if (timerIntervalRef.current) {
                            clearInterval(timerIntervalRef.current);
                            timerIntervalRef.current = null;
                        }
                        setIsConnected(false);
                        setRemainingTime(null);
                        // Store session stats
                        if (errorData.stats) {
                            setSessionStats(errorData.stats);
                        }
                        // Notify the error callback
                        onError?.({ message: errorData.message, stats: errorData.stats });
                    } else if (response.type === MultimodalLiveResponseType.SESSION_END) {
                        const stats = response.data as SessionStats;
                        console.log("🏁 [Gemini] Session ended. Stats:", stats);
                        // Stop audio streaming and playback
                        audioStreamerRef.current?.stop();
                        audioPlayerRef.current?.interrupt();
                        // Clear timer
                        if (timerIntervalRef.current) {
                            clearInterval(timerIntervalRef.current);
                            timerIntervalRef.current = null;
                        }
                        setIsConnected(false);
                        setRemainingTime(null);
                        // Store session stats
                        setSessionStats(stats);
                        // Notify the session end callback
                        onSessionEnd?.(stats);
                    } else if (response.type === MultimodalLiveResponseType.AUDIO) {
                        audioPlayerRef.current?.play(response.data as string | ArrayBuffer);
                    } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
                        onTurnComplete?.();
                    } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
                        const toolData = response.data as ToolCallData;
                        if (toolData.functionCalls) {
                            toolData.functionCalls.forEach((fc) => {
                                const args = fc.args as Record<string, unknown>;
                                // Inject session stats and token usage for complete_mission
                                if (fc.name === "complete_mission") {
                                    if (toolData.sessionStats) {
                                        args.sessionStats = toolData.sessionStats;
                                    }
                                    // Get latest token usage from state ref
                                    args.tokenUsage = tokenUsageRef.current;
                                }
                                client.callFunction(fc.name, args);
                                // Send tool response back to Gemini (required by Live API)
                                if (fc.id) {
                                    client.sendToolResponse(fc.name, fc.id, { result: "ok" });
                                }
                            });
                        }
                    } else if (response.type === MultimodalLiveResponseType.GENERATION_COMPLETE) {
                        console.log("[Gemini] Generation complete");
                    } else if (response.type === MultimodalLiveResponseType.INPUT_TRANSCRIPTION) {
                        const data = response.data as TranscriptionData;
                        onTranscriptInput?.(data.text, data.finished);
                    } else if (response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
                        const data = response.data as TranscriptionData;
                        onTranscriptOutput?.(data.text, data.finished);
                    } else if (response.type === MultimodalLiveResponseType.USAGE_METADATA) {
                        const usage = response.data as UsageMetadata;
                        setTokenUsage((prev) => {
                            if (!prev) {
                                tokenUsageRef.current = usage;
                                return usage;
                            }
                            // Accumulate token counts across messages
                            const accumulated = {
                                promptTokenCount: prev.promptTokenCount + usage.promptTokenCount,
                                responseTokenCount: prev.responseTokenCount + usage.responseTokenCount,
                                totalTokenCount: prev.totalTokenCount + usage.totalTokenCount,
                            };
                            tokenUsageRef.current = accumulated;
                            return accumulated;
                        });
                    }
                };

                client.onConnectionStarted = () => {
                    console.log("🚀 [Gemini] Connection started");
                };

                client.onClose = () => {
                    console.log("🔒 [Gemini] Connection closed");
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                    // Stop audio streaming and fully destroy audio player
                    audioStreamerRef.current?.stop();
                    audioPlayerRef.current?.destroy();
                    setIsConnected(false);
                    setRemainingTime(null);
                    setPlayerAudioContext(null);
                    setPlayerGainNode(null);
                };

                client.onError = () => {
                    audioStreamerRef.current?.stop();
                    audioPlayerRef.current?.destroy();
                    setIsConnected(false);
                    setPlayerAudioContext(null);
                    setPlayerGainNode(null);
                };

                // Connect via qm-center-server (JWT auth for session token)
                // Read token from localStorage if not explicitly provided
                const resolvedToken = jwtToken ?? localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ?? undefined;

                // Read and decrypt Gemini API key from storage if available
                let geminiApiKey: string | undefined;
                try {
                    const encryptedKey = localStorage.getItem(GEMINI_STORAGE_KEYS.API_KEY);
                    if (encryptedKey) {
                        geminiApiKey = await decryptFromStorage(encryptedKey);
                    }
                } catch (err) {
                    console.warn("Failed to decrypt Gemini API key from storage:", err);
                }

                await client.connect(null, sessionDuration, resolvedToken, geminiApiKey);

                // Start audio streaming
                await streamer.start();

                // Set audio contexts for visualizers
                if (streamer.audioContext && streamer.source) {
                    setAudioContext(streamer.audioContext);
                    setAudioSource(streamer.source);
                }

                // Initialize audio player
                await player.init();

                if (player.audioContext && player.gainNode) {
                    setPlayerAudioContext(player.audioContext);
                    setPlayerGainNode(player.gainNode);
                }

                setIsConnected(true);

                // Start session timer countdown
                if (sessionDuration) {
                    setSessionDuration(sessionDuration);
                    setRemainingTime(sessionDuration);
                    const startTime = Date.now();
                    timerIntervalRef.current = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - startTime) / 1000);
                        const remaining = Math.max(0, sessionDuration - elapsed);
                        setRemainingTime(remaining);
                        if (remaining === 0) {
                            if (timerIntervalRef.current) {
                                clearInterval(timerIntervalRef.current);
                                timerIntervalRef.current = null;
                            }
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("Failed to connect:", error);
                onError?.({ message: (error as Error).message });
                throw error;
            } finally {
                setIsConnecting(false);
            }
        },
        [
            isConnecting,
            isConnected,
            onTranscriptInput,
            onTranscriptOutput,
            onTurnComplete,
            onMissionComplete,
            onError,
            onSessionEnd,
        ],
    );

    const disconnect = useCallback(() => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (audioStreamerRef.current) {
            audioStreamerRef.current.stop();
        }
        if (clientRef.current) {
            clientRef.current.disconnect();
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.destroy();
        }

        setIsConnected(false);
        setAudioContext(null);
        setAudioSource(null);
        setPlayerAudioContext(null);
        setPlayerGainNode(null);
        setRemainingTime(null);
        setSessionDuration(null);
        setTokenUsage(null);
        setSessionStats(null);
        tokenUsageRef.current = null;
    }, []);

    return {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        audioContext,
        audioSource,
        playerAudioContext,
        playerGainNode,
        remainingTime,
        sessionDuration,
        tokenUsage,
        sessionStats,
    };
}
