import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Square } from "lucide-react";
import type {
    CompleteIeltsAssessmentArgs,
    IeltsAssessmentResult,
    IeltsConfig,
    SessionStats,
} from "@immersive-lang/shared";
import { calculateOverallBand } from "@immersive-lang/shared";
import { Button } from "@immersive-lang/ui/components/atoms";
import {
    AudioVisualizer,
    ErrorDialog,
    LiveTranscript,
    type LiveTranscriptRef,
    SessionTimer,
    TokenUsage,
} from "@immersive-lang/ui/components/molecules";
import { FunctionCallDefinition } from "@immersive-lang/ui/services";
import { type SessionError, useGeminiLive } from "@immersive-lang/ui/hooks";

const IELTS_SESSION_DURATION = 300; // 5 minutes

function playSound(audio: HTMLAudioElement): void {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch((e) => {
            if (e.name !== "AbortError" && e.name !== "NotSupportedError") {
                console.error("Failed to play sound:", e);
            }
        });
    }
}

function buildIeltsSystemInstructions(topic: string, fromLanguage: string): string {
    return `
IELTS SPEAKING TEST - PART 1 EXAMINER INSTRUCTION:
You are an official IELTS Speaking examiner conducting Part 1 of the IELTS Speaking test.
The candidate's first language is ${fromLanguage}. The test is conducted entirely in English.

EXAMINATION PROTOCOL:
1. **Introduction (30 seconds)**: Introduce yourself as the examiner. Ask the candidate their full name. Ask what you should call them.

2. **Topic Questions (3.5-4 minutes)**: Ask questions about 2-3 familiar topic areas. The primary topic is: "${topic}".
   - Start with simple, factual questions about the topic
   - Progress to questions requiring more opinion and elaboration
   - Ask 3-4 questions per topic area
   - If time allows, transition to a second related topic naturally
   - Common secondary topics: daily routine, hometown, work/studies, hobbies

3. **Question Style**:
   - Ask clear, direct questions
   - Use natural follow-up questions based on the candidate's responses
   - Do NOT help the candidate with vocabulary or grammar
   - Do NOT correct the candidate during the test
   - If the candidate gives very short answers, use prompts like "Can you tell me more about that?" or "Why do you think that is?"
   - If the candidate goes off-topic, gently redirect

4. **Examiner Behavior**:
   - Be professional, friendly but neutral
   - Do NOT give feedback on performance during the test
   - Maintain natural conversational flow
   - Allow the candidate to speak - do not interrupt unless redirecting
   - Use natural speech patterns (not overly formal)

ASSESSMENT COMPLETION:
When approximately 4-5 minutes have elapsed, or when you have covered sufficient topic areas:
1. Thank the candidate for the interview
2. THEN call the "complete_ielts_assessment" tool with detailed scoring

SCORING INSTRUCTIONS - Use the official IELTS Speaking Band Descriptors below:

=== FLUENCY AND COHERENCE (0-9) ===
Ability to talk with normal levels of continuity, rate and effort, and to link ideas together to form coherent speech.
Key indicators: speech rate, speech continuity (not interrupted by false starts, backtracking, functionless repetitions, word-searching pauses), logical sequencing, clear marking of stages with discourse markers/fillers, relevance, use of cohesive devices (connectors, pronouns, conjunctions).

Band 9: Fluent with only very occasional repetition or self-correction. Any hesitation is content-related, not language-related. Speech is situationally appropriate, cohesive features fully acceptable. Topic development fully coherent and appropriately extended.
Band 8: Fluent with only very occasional repetition or self-correction. Hesitation may occasionally be used to find words or grammar, but most will be content related. Topic development is coherent, appropriate and relevant.
Band 7: Able to keep going and readily produce long turns without noticeable effort. Some hesitation, repetition and/or self-correction may occur, often mid-sentence indicating problems accessing appropriate language. However, these will not affect coherence. Flexible use of spoken discourse markers, connectives and cohesive features.
Band 6: Able to keep going and demonstrates a willingness to produce long turns. Coherence may be lost at times as a result of hesitation, repetition and/or self-correction. Uses a range of spoken discourse markers, connectives and cohesive features though not always appropriately.
Band 5: Usually able to keep going, but relies on repetition and self-correction to do so and/or on slow speech. Hesitations often associated with mid-sentence searches for fairly basic lexis and grammar. Overuse of certain discourse markers. More complex speech usually causes disfluency but simpler language may be produced fluently.
Band 4: Unable to keep going without noticeable pauses. Speech may be slow with frequent repetition. Often self-corrects. Can link simple sentences but often with repetitious use of connectives. Some breakdowns in coherence.
Band 3: Frequent, sometimes long, pauses occur while candidate searches for words. Limited ability to link simple sentences and go beyond simple responses. Frequently unable to convey basic message.
Band 2: Lengthy pauses before nearly every word. Isolated words may be recognisable but speech is of virtually no communicative significance.
Band 1: Essentially none. Speech is totally incoherent.

=== LEXICAL RESOURCE (0-9) ===
Range of vocabulary, precision of meanings expressed, ability to paraphrase.
Key indicators: variety of words used, adequacy/appropriacy (referential meaning, style, collocation, attitude), ability to paraphrase.

Band 9: Total flexibility and precise use in all contexts. Sustained use of accurate and idiomatic language.
Band 8: Wide resource, readily and flexibly used to discuss all topics and convey precise meaning. Skilful use of less common and idiomatic items despite occasional inaccuracies in word choice and collocation. Effective use of paraphrase as required.
Band 7: Resource flexibly used to discuss a variety of topics. Some ability to use less common and idiomatic items and an awareness of style and collocation is evident though inappropriacies occur. Effective use of paraphrase as required.
Band 6: Resource sufficient to discuss topics at length. Vocabulary use may be inappropriate but meaning is clear. Generally able to paraphrase successfully.
Band 5: Resource sufficient to discuss familiar and unfamiliar topics but there is limited flexibility. Attempts paraphrase but not always with success.
Band 4: Resource sufficient for familiar topics but only basic meaning can be conveyed on unfamiliar topics. Frequent inappropriacies and errors in word choice. Rarely attempts paraphrase.
Band 3: Resource limited to simple vocabulary used primarily to convey personal information. Vocabulary inadequate for unfamiliar topics.
Band 2: Very limited resource. Utterances consist of isolated words or memorised utterances. Little communication possible without mime or gesture.
Band 1: No resource bar a few isolated words. No communication possible.

=== GRAMMATICAL RANGE AND ACCURACY (0-9) ===
Accurate and appropriate use of syntactic forms and range of grammatical resources.
Key indicators of range: sentence length, subordinate clauses, verb phrase complexity (aspect, modality, passive), pre/post-modification, sentence structure variety.
Key indicators of accuracy: error density, communicative effect of error.

Band 9: Structures are precise and accurate at all times, apart from 'mistakes' characteristic of native speaker speech.
Band 8: Wide range of structures, flexibly used. The majority of sentences are error free. Occasional inappropriacies and non-systematic errors occur. A few basic errors may persist.
Band 7: A range of structures flexibly used. Error-free sentences are frequent. Both simple and complex sentences are used effectively despite some errors. A few basic errors persist.
Band 6: Produces a mix of short and complex sentence forms and a variety of structures with limited flexibility. Though errors frequently occur in complex structures, these rarely impede communication.
Band 5: Basic sentence forms are fairly well controlled for accuracy. Complex structures are attempted but limited in range, nearly always contain errors and may lead to reformulation.
Band 4: Can produce basic sentence forms and some short utterances are error-free. Subordinate clauses are rare and overall, turns are short, structures are repetitive and errors are frequent.
Band 3: Basic sentence forms are attempted but grammatical errors are numerous except in apparently memorised utterances.
Band 2: No evidence of basic sentence forms.
Band 1: No rateable language unless memorised.

=== PRONUNCIATION (0-9) ===
Accurate and sustained use of phonological features to convey meaningful messages.
Key indicators: chunking within sentences, rhythm/stress-timing/linking/elision, emphatic/contrastive stress and intonation, word/phoneme production, overall accent effect on intelligibility.

Band 9: Uses a full range of phonological features to convey precise and/or subtle meaning. Flexible use of features of connected speech is sustained throughout. Can be effortlessly understood throughout. Accent has no effect on intelligibility.
Band 8: Uses a wide range of phonological features to convey precise and/or subtle meaning. Can sustain appropriate rhythm. Flexible use of stress and intonation across long utterances, despite occasional lapses. Can be easily understood throughout. Accent has minimal effect on intelligibility.
Band 7: Displays all the positive features of band 6, and some, but not all, of the positive features of band 8.
Band 6: Uses a range of phonological features, but control is variable. Chunking is generally appropriate, but rhythm may be affected by a lack of stress-timing and/or a rapid speech rate. Some effective use of intonation and stress, but this is not sustained. Individual words or phonemes may be mispronounced but this causes only occasional lack of clarity. Can generally be understood throughout without much effort.
Band 5: Displays all the positive features of band 4, and some, but not all, of the positive features of band 6.
Band 4: Uses some acceptable phonological features, but the range is limited. Produces some acceptable chunking, but there are frequent lapses in overall rhythm. Attempts to use intonation and stress, but control is limited. Individual words or phonemes are frequently mispronounced, causing lack of clarity. Understanding requires some effort and there may be patches of speech that cannot be understood.
Band 3: Displays some features of band 2, and some, but not all, of the positive features of band 4.
Band 2: Uses few acceptable phonological features. Overall problems with delivery impair attempts at connected speech. Individual words and phonemes are mainly mispronounced and little meaning is conveyed. Often unintelligible.
Band 1: Can produce occasional individual words and phonemes that are recognisable, but no overall meaning is conveyed. Unintelligible.

IMPORTANT SCORING NOTES:
- A candidate must fully fit the positive features of the descriptor at a particular level.
- Provide honest, calibrated scores. Most candidates score between 4-7. Only give 8-9 for truly exceptional speakers.
- Include specific examples from the conversation in your comments for each criterion.
- The overall band is the average of 4 criteria, rounded to nearest 0.5.

REMEMBER: You are a professional IELTS examiner. Do NOT teach, correct, or help the candidate during the test. Assess objectively.
`;
}

function buildIeltsAssessmentTool(onComplete: (args: CompleteIeltsAssessmentArgs) => void): FunctionCallDefinition {
    const tool = new FunctionCallDefinition(
        "complete_ielts_assessment",
        "Call this tool when the IELTS Speaking Part 1 assessment is complete. Provide detailed band scores and feedback for each criterion based on the official IELTS band descriptors.",
        {
            type: "OBJECT",
            properties: {
                fluency_and_coherence_band: {
                    type: "NUMBER",
                    description: "Band score 0-9 for Fluency and Coherence",
                },
                fluency_and_coherence_comment: {
                    type: "STRING",
                    description:
                        "Detailed examiner comment for Fluency and Coherence with specific examples from the conversation",
                },
                lexical_resource_band: {
                    type: "NUMBER",
                    description: "Band score 0-9 for Lexical Resource",
                },
                lexical_resource_comment: {
                    type: "STRING",
                    description:
                        "Detailed examiner comment for Lexical Resource with specific examples from the conversation",
                },
                grammatical_range_and_accuracy_band: {
                    type: "NUMBER",
                    description: "Band score 0-9 for Grammatical Range and Accuracy",
                },
                grammatical_range_and_accuracy_comment: {
                    type: "STRING",
                    description:
                        "Detailed examiner comment for Grammatical Range and Accuracy with specific examples from the conversation",
                },
                pronunciation_band: {
                    type: "NUMBER",
                    description: "Band score 0-9 for Pronunciation",
                },
                pronunciation_comment: {
                    type: "STRING",
                    description:
                        "Detailed examiner comment for Pronunciation with specific examples from the conversation",
                },
                overall_comments: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description:
                        "2-3 general observations about the candidate's overall English speaking ability",
                },
                grammar_corrections: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            user_said: {
                                type: "STRING",
                                description: "What the candidate actually said",
                            },
                            issue: {
                                type: "STRING",
                                description: "The grammar/vocabulary issue",
                            },
                            correction: {
                                type: "STRING",
                                description: "The correct form",
                            },
                        },
                        required: ["user_said", "issue", "correction"],
                    },
                    description: "Notable grammar and vocabulary errors during the assessment",
                },
                pronunciation_notes: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description:
                        "Specific pronunciation issues observed (e.g., word stress, intonation patterns, specific sounds)",
                },
                topics_covered: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "List of topic areas that were covered during the assessment",
                },
            },
        },
        [
            "fluency_and_coherence_band",
            "fluency_and_coherence_comment",
            "lexical_resource_band",
            "lexical_resource_comment",
            "grammatical_range_and_accuracy_band",
            "grammatical_range_and_accuracy_comment",
            "pronunciation_band",
            "pronunciation_comment",
            "overall_comments",
            "topics_covered",
        ],
    );

    tool.functionToCall = (args: Record<string, unknown>) => {
        onComplete(args as unknown as CompleteIeltsAssessmentArgs);
    };

    return tool;
}

function clampBand(val: unknown): number {
    const n = typeof val === "number" ? val : parseFloat(String(val)) || 0;
    return Math.max(0, Math.min(9, Math.round(n * 2) / 2));
}

export interface IeltsChatPageProps {
    ieltsConfig: IeltsConfig;
    fromLanguage: string;
    voice: string;
    onBack: () => void;
    onComplete: (result: IeltsAssessmentResult) => void;
}

export function IeltsChatPage({ ieltsConfig, fromLanguage, voice, onBack, onComplete }: IeltsChatPageProps) {
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
            console.log("📝 IELTS Assessment Complete!", args);
            playSound(sounds.winnerSound);
            setPendingCompletion(args);
        },
        [sounds.winnerSound],
    );

    // Build IELTS tool - memoized to avoid recreating on every render
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
                {
                    criterion: "Lexical Resource",
                    band: lr,
                    comment: pendingCompletion.lexical_resource_comment || "",
                },
                {
                    criterion: "Grammatical Range & Accuracy",
                    band: gra,
                    comment: pendingCompletion.grammatical_range_and_accuracy_comment || "",
                },
                {
                    criterion: "Pronunciation",
                    band: p,
                    comment: pendingCompletion.pronunciation_comment || "",
                },
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
            setConnectionStatus("Connected - the examiner will begin");
        } else {
            setConnectionStatus("");
        }
    }, [isConnecting, isConnected]);

    const handleStartStop = async () => {
        if (isActive) {
            disconnect();
            setIsActive(false);
            // Incomplete assessment - no scores
            onComplete({
                bandScores: { fluencyAndCoherence: 0, lexicalResource: 0, grammaticalRangeAndAccuracy: 0, pronunciation: 0, overallBand: 0 },
                criterionFeedback: [],
                overallComments: ["Assessment ended early by the candidate."],
                topicsCovered: [],
            });
        } else {
            setIsActive(true);
            try {
                const systemInstructions = buildIeltsSystemInstructions(ieltsConfig.topic, fromLanguage);
                await connect(
                    systemInstructions,
                    true, // always enable input transcription for assessment
                    true, // always enable output transcription
                    IELTS_SESSION_DURATION,
                    voice,
                    undefined, // jwtToken
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
            {/* Back Button */}
            <button
                onClick={handleBackClick}
                className="absolute top-4 left-4 bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Session Timer */}
            {isActive && isConnected && (
                <SessionTimer
                    remainingTime={remainingTime}
                    sessionDuration={currentSessionDuration}
                    className="absolute top-4 right-4 z-10"
                />
            )}

            {/* Header */}
            <div className="mt-8 text-center">
                <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">IELTS Speaking Part 1</h2>

                {/* Topic Pill */}
                <div className="text-sm font-bold text-text-sub mb-4 inline-flex items-center gap-2 bg-black/4 py-1 px-3 rounded-full border border-black/5">
                    <span>Topic:</span>
                    <span className="text-accent-secondary">{ieltsConfig.topic}</span>
                </div>

                <div className="rounded-2xl py-4 px-6 inline-block mt-4 max-w-200">
                    <p className="text-base opacity-90 text-text-sub">
                        The examiner will ask you questions. Speak naturally and give full answers.
                    </p>
                </div>
            </div>

            {/* Visualizers and Transcript */}
            <div className="flex-1 flex flex-col items-center w-full justify-between gap-2.5">
                {/* Model Visualizer */}
                <div className="w-full h-30 flex items-center justify-center shrink-0">
                    <AudioVisualizer
                        audioContext={playerAudioContext}
                        sourceNode={playerGainNode}
                        role="ai"
                        label="Examiner"
                    />
                </div>

                {/* Transcript */}
                <div
                    ref={(el) => {
                        transcriptRef.current = el as { transcriptRef?: LiveTranscriptRef } | null;
                    }}
                    className="w-full h-62.5 my-2.5 relative"
                >
                    <LiveTranscript />
                </div>

                {/* User Visualizer */}
                <div className="w-full h-30 flex items-center justify-center shrink-0">
                    <AudioVisualizer audioContext={audioContext} sourceNode={audioSource} role="user" label="You" />
                </div>
            </div>

            {/* CTA Button */}
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
                            <span className="text-xl font-extrabold mb-0.5 tracking-wide">Begin Interview</span>
                            <span className="text-sm opacity-90 italic">The examiner will start speaking</span>
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

            {/* Rate Limit Dialog */}
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

            {/* Error Dialog */}
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

            {/* Assessment Completion Confirmation */}
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
