import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TextCyclerProps {
    text: string;
    values: string[];
    interval?: number;
    className?: string;
}

export function TextCycler({ text, values, interval = 3000, className }: TextCyclerProps) {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [showingAnchor, setShowingAnchor] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!values || values.length === 0) return;

        intervalRef.current = setInterval(() => {
            if (showingAnchor) {
                setCurrentIndex((prev) => (prev + 1) % values.length);
                setShowingAnchor(false);
            } else {
                setShowingAnchor(true);
            }
        }, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [values, interval, showingAnchor]);

    const displayText = showingAnchor ? text : values[currentIndex] || text;

    return (
        <span className={className}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={displayText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {displayText}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}
