/**
 * Get language display string with flag
 */
export function formatLanguage(flag: string, name: string): string {
    return `${flag} ${name}`;
}

/**
 * Get difficulty badge color
 */
export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "Easy":
            return "#8bc34a";
        case "Medium":
            return "#ffc107";
        case "Hard":
            return "#ff9800";
        case "Expert":
            return "#f44336";
        default:
            return "#8bc34a";
    }
}

/**
 * Get mission icon based on title
 */
export function getMissionIcon(title: string): string {
    if (title.includes("Free Talk")) return "💬";
    if (title.includes("Coffee")) return "☕";
    if (title.includes("Bus")) return "🚌";
    if (title.includes("dinner")) return "🍕";
    if (title.includes("Shirt")) return "👕";
    if (title.includes("directions")) return "🗺️";
    if (title.includes("Symptoms")) return "🤒";
    if (title.includes("Market")) return "🍎";
    if (title.includes("rent")) return "🏠";
    if (title.includes("Job")) return "💼";
    return "📜";
}

/**
 * Score level mapping
 */
export const SCORE_LEVELS = {
    1: { title: "Tiro", description: "You needed a lot of help" },
    2: { title: "Proficiens", description: "A little help" },
    3: { title: "Peritus", description: "No help, fluid" },
} as const;
