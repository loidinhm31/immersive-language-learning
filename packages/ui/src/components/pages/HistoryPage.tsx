import { useEffect } from "react";
import { History, Trash2, ArrowLeft } from "lucide-react";
import type { SessionHistoryEntry } from "@immersive-lang/shared";
import { Button } from "@immersive-lang/ui/components/atoms";
import { SessionCard } from "@immersive-lang/ui/components/molecules";
import { useSessionHistory } from "@immersive-lang/ui/hooks";

export interface HistoryPageProps {
    onBack: () => void;
    onViewSession?: (entry: SessionHistoryEntry) => void;
}

export function HistoryPage({ onBack, onViewSession }: HistoryPageProps) {
    const { sessions, loading, error, loadSessions, deleteSession, clearHistory } = useSessionHistory();

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleDelete = async (id: string) => {
        await deleteSession(id);
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to clear all session history?")) {
            return;
        }
        await clearHistory();
    };

    return (
        <div className="max-w-[640px] mx-auto px-6 py-8 min-h-screen flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft size={20} />
                </Button>
                <div className="flex items-center gap-2">
                    <History size={24} className="text-accent-primary" />
                    <h1 className="text-2xl font-heading text-text-main">Session History</h1>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-text-sub">Loading history...</div>
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button variant="secondary" onClick={() => loadSessions()}>
                            Try Again
                        </Button>
                    </div>
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <History size={48} className="text-text-sub opacity-30 mb-4" />
                    <h2 className="text-lg font-heading text-text-sub mb-2">No sessions yet</h2>
                    <p className="text-sm text-text-sub opacity-70 mb-6">Complete a mission to see your history here</p>
                    <Button variant="primary" onClick={onBack}>
                        Start a Mission
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-text-sub">
                            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            className="text-text-sub hover:text-destructive"
                        >
                            <Trash2 size={14} className="mr-1" />
                            Clear All
                        </Button>
                    </div>

                    <div className="flex-1">
                        {sessions.map((entry) => (
                            <SessionCard key={entry.id} entry={entry} onDelete={handleDelete} onView={onViewSession} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
