import type { GrammarCorrection, SessionStats, UsageMetadata } from "./gemini";

export interface IeltsBandScore {
    fluencyAndCoherence: number;
    lexicalResource: number;
    grammaticalRangeAndAccuracy: number;
    pronunciation: number;
    overallBand: number;
}

export interface IeltsCriterionFeedback {
    criterion: string;
    band: number;
    comment: string;
}

export interface IeltsAssessmentResult {
    bandScores: IeltsBandScore;
    criterionFeedback: IeltsCriterionFeedback[];
    overallComments: string[];
    grammarCorrections?: GrammarCorrection[];
    pronunciationNotes?: string[];
    topicsCovered: string[];
    elapsedSeconds?: number;
    messageCount?: number;
    audioChunksSent?: number;
    tokenUsage?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

export interface IeltsConfig {
    topic: string;
}

export interface CompleteIeltsAssessmentArgs {
    fluency_and_coherence_band: number;
    fluency_and_coherence_comment: string;
    lexical_resource_band: number;
    lexical_resource_comment: string;
    grammatical_range_and_accuracy_band: number;
    grammatical_range_and_accuracy_comment: string;
    pronunciation_band: number;
    pronunciation_comment: string;
    overall_comments: string[];
    grammar_corrections?: GrammarCorrection[];
    pronunciation_notes?: string[];
    topics_covered: string[];
    sessionStats?: SessionStats;
    tokenUsage?: UsageMetadata;
}

export const IELTS_BAND_LABELS: Record<number, string> = {
    9: "Expert",
    8: "Very Good",
    7: "Good",
    6: "Competent",
    5: "Modest",
    4: "Limited",
    3: "Extremely Limited",
    2: "Intermittent",
    1: "Non-user",
    0: "Did not attempt",
};

export const IELTS_PART1_TOPICS = [
    "Work & Studies",
    "Hometown",
    "Family",
    "Daily Routine",
    "Hobbies & Leisure",
    "Travel",
    "Food & Cooking",
    "Weather & Seasons",
    "Sports & Exercise",
    "Technology",
    "Music",
    "Reading",
    "Shopping",
    "Friends",
    "Health & Fitness",
    "Transport",
    "Festivals & Celebrations",
    "Animals & Pets",
    "Movies & TV",
    "Fashion & Clothing",
] as const;

/**
 * Calculate overall IELTS band score from 4 criteria.
 * Official rule: average of 4 scores, rounded to nearest 0.5.
 */
export function calculateOverallBand(scores: Omit<IeltsBandScore, "overallBand">): number {
    const avg =
        (scores.fluencyAndCoherence +
            scores.lexicalResource +
            scores.grammaticalRangeAndAccuracy +
            scores.pronunciation) /
        4;
    return Math.round(avg * 2) / 2;
}
