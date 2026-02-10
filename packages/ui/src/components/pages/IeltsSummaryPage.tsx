import { Clock, MessageSquare, Mic, Coins, PenLine, Volume2 } from "lucide-react";
import type { IeltsAssessmentResult, IeltsCriterionFeedback, IeltsCueCard, IeltsPart } from "@immersive-lang/shared";
import { IELTS_BAND_LABELS } from "@immersive-lang/shared";
import { Button, Card } from "@immersive-lang/ui/components/atoms";

function getBandColor(band: number): string {
    if (band >= 8) return "#4CAF50";
    if (band >= 6.5) return "#8bc34a";
    if (band >= 5) return "#ffc107";
    if (band >= 4) return "#ff9800";
    return "#f44336";
}

function OverallBandDisplay({ band }: { band: number }) {
    const color = getBandColor(band);
    const label = IELTS_BAND_LABELS[Math.floor(band)] || "";

    return (
        <div className="flex flex-col items-center py-6">
            <p className="text-sm font-bold uppercase tracking-wider text-text-sub mb-2">Overall Band Score</p>
            <div
                className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                style={{ borderColor: color, background: `${color}15` }}
            >
                <span className="text-5xl font-heading font-bold" style={{ color }}>
                    {band}
                </span>
            </div>
            <p className="mt-3 text-lg font-heading font-bold" style={{ color }}>
                {label}
            </p>
        </div>
    );
}

function CriterionCard({ feedback }: { feedback: IeltsCriterionFeedback }) {
    const color = getBandColor(feedback.band);
    const label = IELTS_BAND_LABELS[Math.floor(feedback.band)] || "";

    return (
        <Card className="text-left">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-heading font-bold text-text-main">{feedback.criterion}</h4>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-heading font-bold" style={{ color }}>
                        {feedback.band}
                    </span>
                    <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color, background: `${color}15` }}
                    >
                        {label}
                    </span>
                </div>
            </div>
            {/* Band progress bar */}
            <div className="w-full h-2 rounded-full bg-bg mb-3 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(feedback.band / 9) * 100}%`, backgroundColor: color }}
                />
            </div>
            <p className="text-sm text-text-sub leading-relaxed">{feedback.comment}</p>
        </Card>
    );
}

export interface IeltsSummaryPageProps {
    result: IeltsAssessmentResult;
    part?: IeltsPart;
    topic?: string;
    cueCard?: IeltsCueCard;
    onBackToMissions: () => void;
    onBackToHistory?: () => void;
}

export function IeltsSummaryPage({
    result,
    part = 1,
    topic,
    cueCard,
    onBackToMissions,
    onBackToHistory,
}: IeltsSummaryPageProps) {
    const isIncomplete = result.bandScores.overallBand === 0 && result.criterionFeedback.length === 0;

    return (
        <div className="max-w-[560px] mx-auto px-6 py-8 text-center min-h-screen flex flex-col">
            <h2 className="mt-8 font-heading text-accent-secondary">IELTS Speaking Part {part} Results</h2>

            {topic && (
                <p className="text-text-sub text-sm mt-1">
                    {part === 3 ? "Discussion" : "Topic"}: <span className="font-bold text-text-main">{topic}</span>
                </p>
            )}

            {cueCard && part === 2 && (
                <div className="mt-3 mx-auto max-w-100 text-left bg-surface border border-glass-border rounded-xl p-4">
                    <div className="text-xs font-bold text-accent-secondary uppercase tracking-wider mb-1">
                        Task Card
                    </div>
                    <p className="text-sm font-bold text-text-main mb-1">{cueCard.topic}</p>
                    <ul className="list-disc pl-4 text-xs text-text-sub space-y-0.5">
                        {cueCard.bulletPoints.map((bp, i) => (
                            <li key={i}>{bp}</li>
                        ))}
                    </ul>
                    <p className="text-xs text-accent-secondary/70 mt-1 italic">{cueCard.followUp}</p>
                </div>
            )}

            {isIncomplete ? (
                <div className="my-16 opacity-70">
                    <p className="mt-4 text-lg text-text-sub">Assessment ended early. No scores were awarded.</p>
                </div>
            ) : (
                <>
                    {/* Overall Band Score */}
                    <OverallBandDisplay band={result.bandScores.overallBand} />

                    {/* Criterion Cards */}
                    <div className="space-y-4 mt-4">
                        {result.criterionFeedback.map((cf, i) => (
                            <CriterionCard key={i} feedback={cf} />
                        ))}
                    </div>

                    {/* Overall Comments */}
                    {result.overallComments && result.overallComments.length > 0 && (
                        <Card className="text-left mt-4">
                            <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading">
                                Examiner's Comments
                            </h4>
                            <ul className="pl-6 mt-2 text-text-sub">
                                {result.overallComments.map((comment, i) => (
                                    <li key={i} className="mb-2">
                                        {comment}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Grammar Corrections */}
                    {result.grammarCorrections && result.grammarCorrections.length > 0 && (
                        <Card className="text-left mt-4">
                            <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading flex items-center gap-2">
                                <PenLine size={18} className="text-accent-primary" />
                                Grammar Corrections
                            </h4>
                            <div className="mt-3 space-y-4">
                                {result.grammarCorrections.map((gc, i) => (
                                    <div key={i} className="rounded-xl bg-bg p-3">
                                        <p className="text-sm text-text-sub mb-1">
                                            <span className="line-through text-destructive/80">{gc.user_said}</span>
                                        </p>
                                        <p className="text-xs text-text-sub opacity-70 mb-1">{gc.issue}</p>
                                        <p className="text-sm font-bold text-green-600">{gc.correction}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-text-sub opacity-60">
                                {result.grammarCorrections.length} correction
                                {result.grammarCorrections.length !== 1 ? "s" : ""} noted
                            </p>
                        </Card>
                    )}

                    {/* Pronunciation Notes */}
                    {result.pronunciationNotes && result.pronunciationNotes.length > 0 && (
                        <Card className="text-left mt-4">
                            <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading flex items-center gap-2">
                                <Volume2 size={18} className="text-accent-primary" />
                                Pronunciation Notes
                            </h4>
                            <ul className="pl-6 mt-2 text-text-sub">
                                {result.pronunciationNotes.map((note, i) => (
                                    <li key={i} className="mb-2">
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {/* Topics Covered */}
                    {result.topicsCovered && result.topicsCovered.length > 0 && (
                        <div className="mt-4 text-left">
                            <p className="text-sm font-bold text-text-main mb-2">Topics Covered</p>
                            <div className="flex flex-wrap gap-2">
                                {result.topicsCovered.map((t, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full text-xs font-medium bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Session Statistics */}
                    {(result.elapsedSeconds || result.messageCount || result.tokenUsage) && (
                        <Card className="text-left mt-4">
                            <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading">
                                Session Statistics
                            </h4>
                            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                                {result.elapsedSeconds != null && result.elapsedSeconds > 0 && (
                                    <div className="flex items-center gap-2 text-text-sub">
                                        <Clock size={16} className="opacity-50 flex-shrink-0" />
                                        <span>
                                            <span className="font-bold text-text-main">
                                                {Math.floor(result.elapsedSeconds / 60)}:
                                                {String(Math.floor(result.elapsedSeconds % 60)).padStart(2, "0")}
                                            </span>{" "}
                                            elapsed
                                        </span>
                                    </div>
                                )}
                                {result.messageCount != null && result.messageCount > 0 && (
                                    <div className="flex items-center gap-2 text-text-sub">
                                        <MessageSquare size={16} className="opacity-50 flex-shrink-0" />
                                        <span>
                                            <span className="font-bold text-text-main">
                                                {result.messageCount.toLocaleString()}
                                            </span>{" "}
                                            messages
                                        </span>
                                    </div>
                                )}
                                {result.audioChunksSent != null && result.audioChunksSent > 0 && (
                                    <div className="flex items-center gap-2 text-text-sub">
                                        <Mic size={16} className="opacity-50 flex-shrink-0" />
                                        <span>
                                            <span className="font-bold text-text-main">
                                                {result.audioChunksSent.toLocaleString()}
                                            </span>{" "}
                                            audio chunks
                                        </span>
                                    </div>
                                )}
                                {result.tokenUsage && (
                                    <div className="flex items-center gap-2 text-text-sub">
                                        <Coins size={16} className="opacity-50 flex-shrink-0" />
                                        <span>
                                            <span className="font-bold text-text-main">
                                                {result.tokenUsage.totalTokenCount.toLocaleString()}
                                            </span>{" "}
                                            tokens
                                        </span>
                                    </div>
                                )}
                            </div>
                            {result.tokenUsage && (
                                <div className="mt-2 pt-2 border-t border-bg text-xs text-text-sub opacity-70">
                                    {result.tokenUsage.promptTokenCount.toLocaleString()} prompt,{" "}
                                    {result.tokenUsage.responseTokenCount.toLocaleString()} response
                                </div>
                            )}
                        </Card>
                    )}
                </>
            )}

            <div className="flex-1" />

            {onBackToHistory ? (
                <Button
                    variant="primary"
                    size="lg"
                    onClick={onBackToHistory}
                    className="w-full mb-16 uppercase tracking-wide"
                >
                    Back to History
                </Button>
            ) : (
                <Button
                    variant="primary"
                    size="lg"
                    onClick={onBackToMissions}
                    className="w-full mb-16 uppercase tracking-wide"
                >
                    Back to Mission List
                </Button>
            )}
        </div>
    );
}
