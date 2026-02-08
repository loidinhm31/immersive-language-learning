import { ChevronRight, Clock, Coins, MessageSquare, Mic, PenLine, Trash2 } from "lucide-react";
import type { SessionHistoryEntry } from "@immersive-lang/shared";
import { Button, Card, ScoreBadge } from "@immersive-lang/ui/components/atoms";

export interface SessionCardProps {
    entry: SessionHistoryEntry;
    onDelete: (id: string) => void;
    onView?: (entry: SessionHistoryEntry) => void;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function SessionCard({ entry, onDelete, onView }: SessionCardProps) {
    const result = entry.result;
    const isIncomplete = result.incomplete;
    const hasScore = !isIncomplete && result.score && result.score !== "0";

    return (
        <Card className="mb-3 hover:bg-surface/80 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading text-text-main truncate">
                            {entry.mission?.title || "Freestyle Session"}
                        </span>
                        {entry.mission?.difficulty && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                                {entry.mission.difficulty}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-text-sub mb-2">
                        <span>{entry.language}</span>
                        <span className="opacity-50">from</span>
                        <span>{entry.fromLanguage}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-sub">
                        <span className="flex items-center gap-1">
                            <Clock size={12} className="opacity-50" />
                            {formatDate(entry.completedAt)}
                        </span>
                        {result.elapsedSeconds && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} className="opacity-50" />
                                {formatDuration(result.elapsedSeconds)}
                            </span>
                        )}
                        {result.messageCount && (
                            <span className="flex items-center gap-1">
                                <MessageSquare size={12} className="opacity-50" />
                                {result.messageCount} msgs
                            </span>
                        )}
                        {result.audioChunksSent && (
                            <span className="flex items-center gap-1">
                                <Mic size={12} className="opacity-50" />
                                {result.audioChunksSent} chunks
                            </span>
                        )}
                        {result.tokenUsage && (
                            <span className="flex items-center gap-1">
                                <Coins size={12} className="opacity-50" />
                                {result.tokenUsage.totalTokenCount.toLocaleString()} tokens
                            </span>
                        )}
                    </div>

                    {hasScore && (
                        <div className="mt-2 flex items-center gap-2">
                            <ScoreBadge score={result.score!} />
                            {result.grammarCorrections && result.grammarCorrections.length > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                                    <PenLine size={10} />
                                    {result.grammarCorrections.length} correction
                                    {result.grammarCorrections.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </div>
                    )}
                    {!hasScore &&
                        !isIncomplete &&
                        result.grammarCorrections &&
                        result.grammarCorrections.length > 0 && (
                            <div className="mt-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1 w-fit">
                                    <PenLine size={10} />
                                    {result.grammarCorrections.length} correction
                                    {result.grammarCorrections.length !== 1 ? "s" : ""}
                                </span>
                            </div>
                        )}
                    {isIncomplete && <div className="mt-2 text-xs text-text-sub opacity-70">Session incomplete</div>}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(entry.id)}
                        className="text-text-sub hover:text-destructive"
                    >
                        <Trash2 size={16} />
                    </Button>
                    {onView && (
                        <Button variant="ghost" size="sm" onClick={() => onView(entry)} className="text-text-sub">
                            <ChevronRight size={16} />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}
