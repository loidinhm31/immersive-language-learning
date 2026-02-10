import { AlertTriangle, Clock, MessageSquare, Mic } from "lucide-react";
import type { SessionStats, UsageMetadata } from "@immersive-lang/shared";
import { Button } from "@immersive-lang/ui/components/atoms";

export interface ErrorDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    stats?: SessionStats | null;
    tokenUsage?: UsageMetadata | null;
    onClose: () => void;
}

export function ErrorDialog({ isOpen, title, message, stats, tokenUsage, onClose }: ErrorDialogProps) {
    if (!isOpen) return null;

    // Detect if this is a session limit error (friendlier treatment)
    const isSessionLimit = message.includes("session limit") || message.includes("Session limit");

    const displayTitle = title || (isSessionLimit ? "Session Ended" : "Session Error");
    const IconComponent = isSessionLimit ? Clock : AlertTriangle;
    const iconBgColor = isSessionLimit ? "bg-accent-primary/10" : "bg-danger/10";
    const iconColor = isSessionLimit ? "text-accent-primary" : "text-danger";
    const titleColor = isSessionLimit ? "text-accent-primary" : "text-danger";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4">
            <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-[500px] w-full text-center shadow-lg">
                <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full ${iconBgColor} flex items-center justify-center`}>
                        <IconComponent className={`w-8 h-8 ${iconColor}`} />
                    </div>
                </div>
                <h3 className={`mb-3 text-xl font-heading font-bold ${titleColor}`}>{displayTitle}</h3>
                <p className="mb-4 leading-relaxed text-gray-600 text-sm">{message}</p>

                {/* Session Stats */}
                {(stats || tokenUsage) && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                            Session Statistics
                        </p>
                        <div className="flex justify-center gap-6 text-sm">
                            {stats && (
                                <>
                                    {stats.elapsedSeconds > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-700">
                                                <span className="font-bold">
                                                    {Math.floor(stats.elapsedSeconds / 60)}:
                                                    {String(Math.floor(stats.elapsedSeconds % 60)).padStart(2, "0")}
                                                </span>{" "}
                                                elapsed
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">
                                            <span className="font-bold">{stats.messageCount.toLocaleString()}</span>{" "}
                                            messages
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mic className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">
                                            <span className="font-bold">{stats.audioChunksSent.toLocaleString()}</span>{" "}
                                            audio chunks
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        {(tokenUsage || (stats && stats.totalTokenCount > 0)) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                Tokens: {(tokenUsage?.totalTokenCount ?? stats?.totalTokenCount ?? 0).toLocaleString()}{" "}
                                total ({(tokenUsage?.promptTokenCount ?? stats?.promptTokenCount ?? 0).toLocaleString()}{" "}
                                prompt,{" "}
                                {(tokenUsage?.responseTokenCount ?? stats?.responseTokenCount ?? 0).toLocaleString()}{" "}
                                response)
                            </div>
                        )}
                    </div>
                )}

                <Button variant="primary" onClick={onClose}>
                    {isSessionLimit ? "Start New Session" : "Got it"}
                </Button>
            </div>
        </div>
    );
}
