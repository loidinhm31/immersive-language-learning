import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Square } from "lucide-react";
import type {
    CompleteIeltsAssessmentArgs,
    IeltsAssessmentResult,
    IeltsConfig,
    SessionStats,
} from "@immersive-lang/shared";
import { calculateOverallBand, buildIeltsPart3Prompt } from "@immersive-lang/shared";
import { Button } from "@immersive-lang/ui/components/atoms";
import {
    AudioVisualizer,
    ErrorDialog,
    LiveTranscript,
    type LiveTranscriptRef,
    SessionTimer,
    TokenUsage,
} from "@immersive-lang/ui/components/molecules";
import { type SessionError, useGeminiLive } from "@immersive-lang/ui/hooks";
import { playSound, buildIeltsAssessmentTool, clampBand } from "./IeltsChatPage";

const IELTS_PART3_SESSION_DURATION = 300; // 5 minutes

export interface IeltsPart3ChatPageProps {
    ieltsConfig: IeltsConfig;
    fromLanguage: string;
    voice: string;
    onBack: () => void;
    onComplete: (result: IeltsAssessmentResult) => void;
}

export function IeltsPart3ChatPage({ ieltsConfig, fromLanguage, voice, onBack, onComplete }: IeltsPart3ChatPageProps) {
    const [isActive, setIsActive] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("");
    const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorStats, setErrorStats] = useState<SessionStats | null>(null);
    const [pendingCompletion, setPendingCompletion] = useState<CompleteIeltsAssessmentArgs | null>(null);
    const transcriptRef = useRef<{ transcriptRef?: LiveTranscriptRef } | null>(null);

    const sounds = useMemo(() => {
        const startSound = new Audio("/start-bell.mp3");
        startSound.volume = 0.6;
        startSound.preload = "auto";

        const winnerSound = new Audio("/winner-bell.mp3");
        winnerSound.volume = 0.6;
        winnerSound.preload = "auto";

        return { startSound, winnerSound };
    }, []);

    const handleAssessmentComplete = useCallback(
        (args: CompleteIeltsAssessmentArgs) => {
            playSound(sounds.winnerSound);
            setPendingCompletion(args);
        },
        [sounds.winnerSound],
    );

    const ieltsTools = useMemo(() => {
        return [buildIeltsAssessmentTool(handleAssessmentComplete)];
    }, [handleAssessmentComplete]);

    const handleTranscriptInput = useCallback((text: string, finished: boolean) => {
        const ref = transcriptRef.current?.transcriptRef;
        if (ref) ref.addInputTranscript(text, finished);
    }, []);

    const handleTranscriptOutput = useCallback((text: string, finished: boolean) => {
        const ref = transcriptRef.current?.transcriptRef;
        if (ref) ref.addOutputTranscript(text, finished);
    }, []);

    const handleTurnComplete = useCallback(() => {
        const ref = transcriptRef.current?.transcriptRef;
        if (ref) ref.finalizeAll();
    }, []);

    const handleError = useCallback((error: SessionError) => {
        setIsActive(false);
        if (error.status === 429) {
            setShowRateLimitDialog(true);
        } else {
            setErrorMessage(error.message);
            setErrorStats(error.stats || null);
        }
    }, []);

    const {
        isConnected,
        isConnecting,
        connect,
        disconnect,
        audioContext,
        audioSource,
        playerAudioContext,
        playerGainNode,
        remainingTime,
        sessionDuration: currentSessionDuration,
        tokenUsage,
    } = useGeminiLive({
        onTranscriptInput: handleTranscriptInput,
        onTranscriptOutput: handleTranscriptOutput,
        onTurnComplete: handleTurnComplete,
        onError: handleError,
    });

    const handleConfirmCompletion = useCallback(() => {
        if (!pendingCompletion) return;

        const fc = clampBand(pendingCompletion.fluency_and_coherence_band);
        const lr = clampBand(pendingCompletion.lexical_resource_band);
        const gra = clampBand(pendingCompletion.grammatical_range_and_accuracy_band);
        const p = clampBand(pendingCompletion.pronunciation_band);
        const overallBand = calculateOverallBand({
            fluencyAndCoherence: fc,
            lexicalResource: lr,
            grammaticalRangeAndAccuracy: gra,
            pronunciation: p,
        });

        disconnect();
        setIsActive(false);
        setPendingCompletion(null);

        onComplete({
            bandScores: {
                fluencyAndCoherence: fc,
                lexicalResource: lr,
                grammaticalRangeAndAccuracy: gra,
                pronunciation: p,
                overallBand,
            },
            criterionFeedback: [
                {
                    criterion: "Fluency & Coherence",
                    band: fc,
                    comment: pendingCompletion.fluency_and_coherence_comment || "",
                },
                { criterion: "Lexical Resource", band: lr, comment: pendingCompletion.lexical_resource_comment || "" },
                {
                    criterion: "Grammatical Range & Accuracy",
                    band: gra,
                    comment: pendingCompletion.grammatical_range_and_accuracy_comment || "",
                },
                { criterion: "Pronunciation", band: p, comment: pendingCompletion.pronunciation_comment || "" },
            ],
            overallComments: pendingCompletion.overall_comments || [],
            grammarCorrections: pendingCompletion.grammar_corrections,
            pronunciationNotes: pendingCompletion.pronunciation_notes,
            topicsCovered: pendingCompletion.topics_covered || [],
            elapsedSeconds: pendingCompletion.sessionStats?.elapsedSeconds,
            messageCount: pendingCompletion.sessionStats?.messageCount,
            audioChunksSent: pendingCompletion.sessionStats?.audioChunksSent,
            tokenUsage: pendingCompletion.tokenUsage ?? (tokenUsage || undefined),
        });
    }, [pendingCompletion, disconnect, onComplete, tokenUsage]);

    useEffect(() => {
        if (isConnecting) {
            setConnectionStatus("Connecting...");
        } else if (isConnected) {
            setConnectionStatus("Connected - the discussion will begin");
        } else {
            setConnectionStatus("");
        }
    }, [isConnecting, isConnected]);

    const handleStartStop = async () => {
        if (isActive) {
            disconnect();
            setIsActive(false);
            onComplete({
                bandScores: {
                    fluencyAndCoherence: 0,
                    lexicalResource: 0,
                    grammaticalRangeAndAccuracy: 0,
                    pronunciation: 0,
                    overallBand: 0,
                },
                criterionFeedback: [],
                overallComments: ["Assessment ended early by the candidate."],
                topicsCovered: [],
            });
        } else {
            setIsActive(true);
            try {
                const systemInstructions = buildIeltsPart3Prompt(
                    ieltsConfig.topic,
                    fromLanguage,
                    IELTS_PART3_SESSION_DURATION,
                );
                await connect(
                    systemInstructions,
                    true,
                    true,
                    IELTS_PART3_SESSION_DURATION,
                    voice,
                    undefined,
                    ieltsTools,
                );
                playSound(sounds.startSound);
            } catch {
                setIsActive(false);
            }
        }
    };

    const handleBackClick = () => {
        disconnect();
        onBack();
    };

    return (
        <div className="relative min-h-screen flex flex-col max-w-130 mx-auto px-6 pb-8">
            <button
                onClick={handleBackClick}
                className="absolute top-4 left-4 bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10"
            >
                <ArrowLeft size={24} />
            </button>

            {isActive && isConnected && (
                <SessionTimer
                    remainingTime={remainingTime}
                    sessionDuration={currentSessionDuration}
                    showElapsed
                    className="absolute top-4 right-4 z-10"
                />
            )}

            <div className="mt-8 text-center">
                <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">IELTS Speaking Part 3</h2>

                <div className="text-sm font-bold text-text-sub mb-4 inline-flex items-center gap-2 bg-black/4 py-1 px-3 rounded-full border border-black/5">
                    <span>Discussion:</span>
                    <span className="text-accent-secondary">{ieltsConfig.topic}</span>
                </div>

                <div className="rounded-2xl py-4 px-6 inline-block mt-4 max-w-200">
                    <p className="text-base opacity-90 text-text-sub">
                        The examiner will ask you deeper questions. Discuss, analyze, and justify your opinions.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center w-full justify-between gap-2.5">
                <div className="w-full h-30 flex items-center justify-center shrink-0">
                    <AudioVisualizer
                        audioContext={playerAudioContext}
                        sourceNode={playerGainNode}
                        role="ai"
                        label="Examiner"
                    />
                </div>

                <div
                    ref={(el) => {
                        transcriptRef.current = el as { transcriptRef?: LiveTranscriptRef } | null;
                    }}
                    className="w-full h-62.5 my-2.5 relative"
                >
                    <LiveTranscript />
                </div>

                <div className="w-full h-30 flex items-center justify-center shrink-0">
                    <AudioVisualizer audioContext={audioContext} sourceNode={audioSource} role="user" label="You" />
                </div>
            </div>

            <div className="mb-16 flex flex-col gap-6 items-center z-10 relative">
                <Button
                    variant={isActive ? "danger" : "primary"}
                    size="lg"
                    onClick={handleStartStop}
                    isLoading={isConnecting}
                    className="min-w-70 flex-col py-6"
                >
                    {isActive ? (
                        <span className="flex items-center gap-3">
                            <Square size={20} />
                            <span className="font-extrabold text-lg tracking-wide uppercase">End Assessment</span>
                        </span>
                    ) : (
                        <>
                            <span className="text-xl font-extrabold mb-0.5 tracking-wide">Begin Discussion</span>
                            <span className="text-sm opacity-90 italic">The examiner will start the discussion</span>
                        </>
                    )}
                </Button>

                <p
                    className="mt-2 text-sm font-bold h-5 transition-all duration-300 tracking-wide uppercase"
                    style={{ color: isConnected ? "#4CAF50" : "var(--color-text-sub)" }}
                >
                    {connectionStatus}
                </p>

                {isActive && isConnected && tokenUsage && <TokenUsage tokenUsage={tokenUsage} className="mt-2" />}
            </div>

            {showRateLimitDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-125 text-center shadow-lg">
                        <h3 className="mb-4 text-accent-primary font-heading">Oops, this is too popular!</h3>
                        <p className="mb-6 leading-relaxed">
                            The global quota has been reached. Try again later or deploy your own version.
                        </p>
                        <Button variant="primary" onClick={() => setShowRateLimitDialog(false)}>
                            Got it
                        </Button>
                    </div>
                </div>
            )}

            <ErrorDialog
                isOpen={!!errorMessage}
                message={errorMessage || ""}
                stats={errorStats}
                tokenUsage={tokenUsage}
                onClose={() => {
                    setErrorMessage(null);
                    setErrorStats(null);
                }}
            />

            {pendingCompletion && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
                    <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-125 w-full text-center shadow-lg">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h3 className="mb-2 text-2xl font-heading font-bold text-accent-primary">
                            Assessment Complete
                        </h3>
                        <p className="mb-6 text-gray-600 leading-relaxed">
                            The examiner has finished scoring your speaking test. Ready to see your results?
                        </p>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleConfirmCompletion}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} />
                            View My Results
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
