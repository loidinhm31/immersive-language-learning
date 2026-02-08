import { cn } from "@immersive-lang/shared";

export interface SessionTimerProps {
    remainingTime: number | null;
    sessionDuration: number | null;
    warningThreshold?: number;
    dangerThreshold?: number;
    className?: string;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function SessionTimer({
    remainingTime,
    sessionDuration,
    warningThreshold = 60,
    dangerThreshold = 30,
    className,
}: SessionTimerProps) {
    if (remainingTime === null || sessionDuration === null) {
        return null;
    }

    const progress = (remainingTime / sessionDuration) * 100;
    const isWarning = remainingTime <= warningThreshold && remainingTime > dangerThreshold;
    const isDanger = remainingTime <= dangerThreshold;

    const textColor = isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-cream/80";

    const progressColor = isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-olive";

    return (
        <div className={cn("flex flex-col items-end gap-1", className)}>
            <div className={cn("font-mono text-lg font-semibold", textColor)}>{formatTime(remainingTime)}</div>
            <div className="w-24 h-1.5 bg-cream/20 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-1000 ease-linear rounded-full", progressColor)}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
