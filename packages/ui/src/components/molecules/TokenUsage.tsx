import { cn } from "@immersive-lang/shared";
import type { UsageMetadata } from "@immersive-lang/shared";

export interface TokenUsageProps {
    tokenUsage: UsageMetadata | null;
    className?: string;
}

function formatNumber(num: number): string {
    return num.toLocaleString();
}

export function TokenUsage({ tokenUsage, className }: TokenUsageProps) {
    if (!tokenUsage) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-3 text-xs font-mono text-cream/60", className)}>
            <span title="Input tokens">
                In: <span className="text-cream/80">{formatNumber(tokenUsage.promptTokenCount)}</span>
            </span>
            <span className="text-cream/30">|</span>
            <span title="Output tokens">
                Out: <span className="text-cream/80">{formatNumber(tokenUsage.responseTokenCount)}</span>
            </span>
            <span className="text-cream/30">|</span>
            <span title="Total tokens">
                Total: <span className="text-cream/80">{formatNumber(tokenUsage.totalTokenCount)}</span>
            </span>
        </div>
    );
}
