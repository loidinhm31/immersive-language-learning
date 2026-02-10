import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Clock, ChevronDown, ChevronUp, Square } from "lucide-react";
import type {
    CompleteIeltsAssessmentArgs,
    IeltsAssessmentResult,
    IeltsCueCard,
    IeltsConfig,
    SessionStats,
} from "@immersive-lang/shared";
import { calculateOverallBand, buildIeltsPart2Prompt } from "@immersive-lang/shared";
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

const IELTS_PART2_SESSION_DURATION = 240; // 4 minutes for speaking + follow-up
const PREPARATION_DURATION = 60; // 1 minute preparation

type Part2Phase = "cue-card" | "preparation" | "speaking";

function CueCardDisplay({ cueCard, compact }: { cueCard: IeltsCueCard; compact?: boolean }) {
    const [expanded, setExpanded] = useState(!compact);

    if (compact) {
        return (
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left bg-surface/80 backdrop-blur-sm border border-glass-border rounded-xl px-4 py-2 transition-all cursor-pointer"
            >
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-main truncate">{cueCard.topic}</span>
                    {expanded ? (
                        <ChevronUp size={16} className="text-text-sub shrink-0" />
                    ) : (
                        <ChevronDown size={16} className="text-text-sub shrink-0" />
                    )}
                </div>
                {expanded && (
                    <div className="mt-2 pt-2 border-t border-glass-border">
                        <p className="text-xs text-text-sub mb-1">You should say:</p>
                        <ul className="list-disc pl-4 text-xs text-text-sub space-y-0.5">
                            {cueCard.bulletPoints.map((bp, i) => (
                                <li key={i}>{bp}</li>
                            ))}
                        </ul>
                        <p className="text-xs text-accent-secondary mt-1 italic">{cueCard.followUp}</p>
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="bg-surface border-2 border-accent-secondary/30 rounded-2xl p-6 max-w-120 mx-auto">
            <div className="text-xs font-bold text-accent-secondary uppercase tracking-wider mb-3">Task Card</div>
            <h3 className="text-lg font-heading font-bold text-text-main mb-4">{cueCard.topic}</h3>
            <p className="text-sm font-bold text-text-sub mb-2">You should say:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-text-sub mb-4">
                {cueCard.bulletPoints.map((bp, i) => (
                    <li key={i}>{bp}</li>
                ))}
            </ul>
            <p className="text-sm text-accent-secondary font-medium italic">{cueCard.followUp}</p>
        </div>
    );
}

function PreparationTimer({ timeLeft }: { timeLeft: number }) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const isDanger = timeLeft <= 10;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-text-sub">
                <Clock size={18} />
                <span className="text-sm font-bold uppercase tracking-wide">Preparation Time</span>
            </div>
            <div
                className={`font-mono text-6xl font-bold transition-colors ${isDanger ? "text-red-500" : "text-accent-primary"}`}
            >
                {mins}:{secs.toString().padStart(2, "0")}
            </div>
            <p className="text-sm text-text-sub opacity-70">Make notes and plan your response</p>
        </div>
    );
}

export interface IeltsPart2ChatPageProps {
    ieltsConfig: IeltsConfig;
    fromLanguage: string;
    voice: string;
    onBack: () => void;
    onComplete: (result: IeltsAssessmentResult) => void;
}

export function IeltsPart2ChatPage({ ieltsConfig, fromLanguage, voice, onBack, onComplete }: IeltsPart2ChatPageProps) {
    const [phase, setPhase] = useState<Part2Phase>("cue-card");
    const [prepTimeLeft, setPrepTimeLeft] = useState(PREPARATION_DURATION);
    const [isActive, setIsActive] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("");
    const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorStats, setErrorStats] = useState<SessionStats | null>(null);
    const [pendingCompletion, setPendingCompletion] = useState<CompleteIeltsAssessmentArgs | null>(null);
    const transcriptRef = useRef<{ transcriptRef?: LiveTranscriptRef } | null>(null);
    const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cueCard = ieltsConfig.cueCard!;

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

    // Start speaking phase after preparation ends
    const startSpeakingPhase = useCallback(async () => {
        setPhase("speaking");
        setIsActive(true);
        try {
            const systemInstructions = buildIeltsPart2Prompt(cueCard, fromLanguage, IELTS_PART2_SESSION_DURATION);
            await connect(systemInstructions, true, true, IELTS_PART2_SESSION_DURATION, voice, undefined, ieltsTools);
            playSound(sounds.startSound);
        } catch {
            setIsActive(false);
        }
    }, [cueCard, fromLanguage, voice, connect, ieltsTools, sounds.startSound]);

    // Preparation timer
    useEffect(() => {
        if (phase !== "preparation") return;

        const startTime = Date.now();
        prepTimerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, PREPARATION_DURATION - elapsed);
            setPrepTimeLeft(remaining);
            if (remaining === 0) {
                if (prepTimerRef.current) {
                    clearInterval(prepTimerRef.current);
                    prepTimerRef.current = null;
                }
                startSpeakingPhase();
            }
        }, 1000);

        return () => {
            if (prepTimerRef.current) {
                clearInterval(prepTimerRef.current);
                prepTimerRef.current = null;
            }
        };
    }, [phase, startSpeakingPhase]);

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
            setConnectionStatus("Connected - begin your long turn");
        } else {
            setConnectionStatus("");
        }
    }, [isConnecting, isConnected]);

    const handleStartPreparation = () => {
        setPhase("preparation");
    };

    const handleSkipPreparation = () => {
        if (prepTimerRef.current) {
            clearInterval(prepTimerRef.current);
            prepTimerRef.current = null;
        }
        startSpeakingPhase();
    };

    const handleEndAssessment = () => {
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
    };

    const handleBackClick = () => {
        if (prepTimerRef.current) {
            clearInterval(prepTimerRef.current);
            prepTimerRef.current = null;
        }
        disconnect();
        onBack();
    };

    // Phase 1: Cue Card Display
    if (phase === "cue-card") {
        return (
            <div className="relative min-h-screen flex flex-col max-w-130 mx-auto px-6 pb-8">
                <button
                    onClick={handleBackClick}
                    className="absolute top-4 left-4 bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="mt-8 text-center">
                    <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">IELTS Speaking Part 2</h2>
                    <p className="text-sm text-text-sub mb-6">Individual Long Turn</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-8">
                    <CueCardDisplay cueCard={cueCard} />

                    <div className="text-center text-sm text-text-sub max-w-100">
                        <p>
                            Read the task card carefully. When you start preparation, you will have{" "}
                            <strong>1 minute</strong> to plan your response.
                        </p>
                        <p className="mt-1">
                            Then you will speak for <strong>1-2 minutes</strong> on this topic.
                        </p>
                    </div>
                </div>

                <div className="mb-16 text-center">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleStartPreparation}
                        className="min-w-70 flex-col py-6"
                    >
                        <span className="text-xl font-extrabold mb-0.5 tracking-wide">Start Preparation</span>
                        <span className="text-sm opacity-90 italic">1 minute to plan your response</span>
                    </Button>
                </div>
            </div>
        );
    }

    // Phase 2: Preparation
    if (phase === "preparation") {
        return (
            <div className="relative min-h-screen flex flex-col max-w-130 mx-auto px-6 pb-8">
                <button
                    onClick={handleBackClick}
                    className="absolute top-4 left-4 bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="mt-8 text-center">
                    <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">IELTS Speaking Part 2</h2>
                    <p className="text-sm text-text-sub mb-4">Preparing your response...</p>
                </div>

                <div className="mb-4">
                    <CueCardDisplay cueCard={cueCard} compact />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    <PreparationTimer timeLeft={prepTimeLeft} />
                </div>

                <div className="mb-16 text-center">
                    <Button variant="secondary" size="lg" onClick={handleSkipPreparation} className="min-w-70">
                        <span className="font-bold">Skip — I'm Ready</span>
                    </Button>
                </div>
            </div>
        );
    }

    // Phase 3: Speaking + Follow-up
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
                <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">IELTS Speaking Part 2</h2>
                <p className="text-sm text-text-sub mb-2">Speak for 1-2 minutes on your topic</p>
            </div>

            <div className="mb-2">
                <CueCardDisplay cueCard={cueCard} compact />
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
                    variant="danger"
                    size="lg"
                    onClick={handleEndAssessment}
                    isLoading={isConnecting}
                    className="min-w-70 flex-col py-6"
                >
                    <span className="flex items-center gap-3">
                        <Square size={20} />
                        <span className="font-extrabold text-lg tracking-wide uppercase">End Assessment</span>
                    </span>
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
