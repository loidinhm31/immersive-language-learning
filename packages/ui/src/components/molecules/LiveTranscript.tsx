import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";
import { cn } from "@immersive-lang/shared";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptBubble {
    id: string;
    role: "user" | "model";
    segments: string[];
    isTemp: boolean;
}

export interface LiveTranscriptProps {
    className?: string;
}

export interface LiveTranscriptRef {
    addInputTranscript: (text: string, isFinal: boolean) => void;
    addOutputTranscript: (text: string, isFinal: boolean) => void;
    finalizeAll: () => void;
}

export function LiveTranscript({ className }: LiveTranscriptProps) {
    const [bubbles, setBubbles] = useState<TranscriptBubble[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const idCounterRef = useRef(0);

    const scrollToBottom = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, []);

    const addTranscript = useCallback(
        (role: "user" | "model", text: string, _isFinal: boolean) => {
            setBubbles((prev) => {
                // Finalize other roles
                const finalized = prev.map((b) => {
                    if (b.role !== role && b.isTemp) {
                        return { ...b, isTemp: false };
                    }
                    return b;
                });

                // Find existing temp bubble for this role
                const existingTempIndex = finalized.findIndex((b) => b.role === role && b.isTemp);

                if (existingTempIndex >= 0) {
                    // Add to existing bubble
                    const updated = [...finalized];
                    updated[existingTempIndex] = {
                        ...updated[existingTempIndex],
                        segments: [...updated[existingTempIndex].segments, text],
                    };
                    return updated;
                }

                // Create new bubble
                idCounterRef.current += 1;
                return [
                    ...finalized,
                    {
                        id: `bubble-${idCounterRef.current}`,
                        role,
                        segments: [text],
                        isTemp: true,
                    },
                ];
            });

            setTimeout(scrollToBottom, 10);
        },
        [scrollToBottom],
    );

    const addInputTranscript = useCallback(
        (text: string, isFinal: boolean) => {
            addTranscript("user", text, isFinal);
        },
        [addTranscript],
    );

    const addOutputTranscript = useCallback(
        (text: string, isFinal: boolean) => {
            addTranscript("model", text, isFinal);
        },
        [addTranscript],
    );

    const finalizeAll = useCallback(() => {
        setBubbles((prev) => prev.map((b) => ({ ...b, isTemp: false })));
    }, []);

    // Expose methods via window for parent component access
    useEffect(() => {
        const element = containerRef.current?.parentElement;
        if (element) {
            (element as unknown as { transcriptRef: LiveTranscriptRef }).transcriptRef = {
                addInputTranscript,
                addOutputTranscript,
                finalizeAll,
            };
        }
    }, [addInputTranscript, addOutputTranscript, finalizeAll]);

    return (
        <div className={cn("w-full h-full overflow-hidden font-sans", className)}>
            <div
                ref={containerRef}
                className="h-full overflow-y-auto p-4 flex flex-col gap-2 scroll-smooth"
                style={{
                    maskImage:
                        "linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%)",
                }}
            >
                <AnimatePresence>
                    {bubbles.map((bubble) => (
                        <motion.div
                            key={bubble.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: bubble.isTemp ? 0.7 : 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "max-w-[80%] px-4 py-2 text-lg leading-relaxed break-words",
                                bubble.role === "model" && "self-start text-left text-gray-800",
                                bubble.role === "user" && "self-end text-right text-accent-primary font-medium",
                            )}
                        >
                            {bubble.segments.map((segment, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {i > 0 && !segment.startsWith(" ") && !bubble.segments[i - 1].endsWith(" ")
                                        ? " "
                                        : ""}
                                    {segment}
                                </motion.span>
                            ))}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {/* Spacer for smooth scrolling */}
                <div className="min-h-[120px] flex-shrink-0" />
            </div>
        </div>
    );
}

// Hook to use transcript methods
export function useTranscriptRef(ref: React.RefObject<HTMLDivElement | null>): LiveTranscriptRef | null {
    const [transcriptRef, setTranscriptRef] = useState<LiveTranscriptRef | null>(null);

    useEffect(() => {
        if (ref.current) {
            const maybeRef = (ref.current as unknown as { transcriptRef?: LiveTranscriptRef }).transcriptRef;
            if (maybeRef) {
                setTranscriptRef(maybeRef);
            }
        }
    }, [ref]);

    return transcriptRef;
}
