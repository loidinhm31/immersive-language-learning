import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@immersive-lang/shared";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
    difficulty?: string;
}

export function Badge({ children, className, difficulty, ...props }: BadgeProps) {
    // Map difficulty to theme color classes
    const getDifficultyClasses = (diff: string) => {
        switch (diff) {
            case "Easy":
                return "bg-success/10 text-success border-success/30";
            case "Medium":
                return "bg-warning/10 text-warning border-warning/30";
            case "Hard":
                return "bg-secondary-400/10 text-secondary-400 border-secondary-400/30";
            case "Expert":
                return "bg-danger/10 text-danger border-danger/30";
            default:
                return "bg-success/10 text-success border-success/30";
        }
    };

    const colorClasses = difficulty ? getDifficultyClasses(difficulty) : "bg-success/10 text-success border-success/30";

    return (
        <span
            className={cn(
                "inline-flex items-center px-2 py-1 rounded-lg border",
                "text-xs font-extrabold uppercase tracking-wide",
                colorClasses,
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
