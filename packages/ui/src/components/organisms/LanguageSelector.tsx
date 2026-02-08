import { type ChangeEvent } from "react";
import { cn } from "@immersive-lang/shared";
import { ChevronDown } from "lucide-react";

const LANGUAGE_OPTIONS = [
    "🇬🇧 English",
    "🇩🇪 German",
    "🇪🇸 Spanish",
    "🇫🇷 French",
    "🇮🇳 Hindi",
    "🇦🇪 Arabic",
    "🇮🇩 Indonesian",
    "🇮🇹 Italian",
    "🇯🇵 Japanese",
    "🇰🇷 Korean",
    "🇧🇷 Portuguese",
    "🇷🇺 Russian",
    "🇳🇱 Dutch",
    "🇵🇱 Polish",
    "🇧🇩 Bengali",
    "🇮🇳 Marathi",
    "🇮🇳 Tamil",
    "🇮🇳 Telugu",
    "🇹🇭 Thai",
    "🇹🇷 Turkish",
    "🇻🇳 Vietnamese",
    "🇷🇴 Romanian",
    "🇺🇦 Ukrainian",
    "🧑‍🔬 Science Jargon",
];

export interface LanguageSelectorProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    variant?: "default" | "accent";
    className?: string;
}

export function LanguageSelector({ value, onChange, label, variant = "default", className }: LanguageSelectorProps) {
    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    const isAccent = variant === "accent";

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <label
                className={cn(
                    "text-xs uppercase tracking-wider font-bold ml-1",
                    isAccent ? "text-accent-secondary" : "text-text-sub",
                )}
            >
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={handleChange}
                    className={cn(
                        "w-full py-3 px-4 rounded-xl appearance-none cursor-pointer",
                        "bg-surface text-text-main font-semibold text-base",
                        "border transition-all duration-200",
                        "hover:bg-bg focus:outline-none focus:ring-2 focus:ring-accent-primary",
                        isAccent ? "border-accent-secondary shadow-sm" : "border-glass-border",
                    )}
                >
                    {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <div
                    className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none",
                        isAccent ? "text-accent-secondary" : "opacity-50",
                    )}
                >
                    <ChevronDown size={16} />
                </div>
            </div>
        </div>
    );
}
