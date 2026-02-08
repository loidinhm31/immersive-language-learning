import { Star } from "lucide-react";
import { SCORE_LEVELS } from "@immersive-lang/shared";

export interface ScoreBadgeProps {
    score: string;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
    const scoreNum = parseInt(score, 10);
    const level = SCORE_LEVELS[scoreNum as keyof typeof SCORE_LEVELS];

    if (!level) return null;

    return (
        <div className="flex items-center gap-1 text-accent-secondary">
            {Array.from({ length: scoreNum }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
            ))}
            <span className="text-xs font-medium ml-1">{level.title}</span>
        </div>
    );
}
