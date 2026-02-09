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

export type IeltsPart = 1 | 2 | 3;

export interface IeltsCueCard {
    topic: string;
    bulletPoints: string[];
    followUp: string;
}

export interface IeltsConfig {
    part: IeltsPart;
    topic: string;
    cueCard?: IeltsCueCard;
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

export const IELTS_PART2_CUE_CARDS: IeltsCueCard[] = [
    {
        topic: "Describe a book you recently read",
        bulletPoints: ["what the book was about", "why you chose to read it", "how long it took you to read it"],
        followUp: "and explain what you liked or disliked about it",
    },
    {
        topic: "Describe a place you would like to visit",
        bulletPoints: ["where it is", "how you heard about it", "what you would do there"],
        followUp: "and explain why you would like to visit this place",
    },
    {
        topic: "Describe an important decision you made",
        bulletPoints: ["what the decision was", "when you made it", "how you made the decision"],
        followUp: "and explain how you felt about the decision afterwards",
    },
    {
        topic: "Describe a skill you would like to learn",
        bulletPoints: ["what the skill is", "why you want to learn it", "how you would learn it"],
        followUp: "and explain how this skill would be useful to you",
    },
    {
        topic: "Describe a person who has influenced you",
        bulletPoints: ["who this person is", "how you know them", "what they have done"],
        followUp: "and explain how they have influenced you",
    },
    {
        topic: "Describe a memorable journey you have taken",
        bulletPoints: ["where you went", "how you travelled", "who you were with"],
        followUp: "and explain what made it memorable",
    },
    {
        topic: "Describe a time when you helped someone",
        bulletPoints: ["who you helped", "what the situation was", "what you did to help"],
        followUp: "and explain how you felt about helping them",
    },
    {
        topic: "Describe a piece of technology you find useful",
        bulletPoints: ["what the technology is", "when you started using it", "how often you use it"],
        followUp: "and explain why you find it useful",
    },
    {
        topic: "Describe a festival or celebration you enjoy",
        bulletPoints: ["what the festival is", "when it takes place", "what people do during it"],
        followUp: "and explain why you enjoy this festival",
    },
    {
        topic: "Describe a goal you have set for yourself",
        bulletPoints: ["what the goal is", "when you set it", "what you are doing to achieve it"],
        followUp: "and explain why this goal is important to you",
    },
    {
        topic: "Describe a movie or TV show that impressed you",
        bulletPoints: ["what it was about", "when you watched it", "who was in it"],
        followUp: "and explain why it impressed you",
    },
    {
        topic: "Describe a teacher who has had a great impact on you",
        bulletPoints: ["who this teacher was", "what subject they taught", "what made them special"],
        followUp: "and explain what impact they had on your life",
    },
    {
        topic: "Describe a sport or physical activity you enjoy",
        bulletPoints: ["what the activity is", "when and where you do it", "who you do it with"],
        followUp: "and explain why you enjoy this activity",
    },
    {
        topic: "Describe a time when you received good news",
        bulletPoints: ["what the news was", "when you received it", "how you found out"],
        followUp: "and explain how you felt when you heard the news",
    },
    {
        topic: "Describe a challenge you have faced",
        bulletPoints: ["what the challenge was", "when it happened", "how you dealt with it"],
        followUp: "and explain what you learned from the experience",
    },
];

export const IELTS_PART3_TOPICS = [
    "Education & Learning",
    "Technology & Society",
    "Environment & Sustainability",
    "Health & Lifestyle",
    "Work & Career",
    "Culture & Traditions",
    "Media & Communication",
    "Urbanization & Housing",
    "Family & Relationships",
    "Travel & Tourism",
    "Art & Creativity",
    "Science & Innovation",
    "Crime & Justice",
    "Globalization",
    "Youth & Aging",
    "Food & Agriculture",
    "Government & Policy",
    "Sports & Competition",
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
