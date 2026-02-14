export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface Mission {
    id: number;
    title: string;
    difficulty: Difficulty;
    desc: string;
    target_role: string;
    freestyle?: boolean;
}

export interface Language {
    code: string;
    name: string;
    flag: string;
}

export const LANGUAGES: Language[] = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "ar", name: "Arabic", flag: "🇦🇪" },
    { code: "id", name: "Indonesian", flag: "🇮🇩" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "pt", name: "Portuguese", flag: "🇧🇷" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "pl", name: "Polish", flag: "🇵🇱" },
    { code: "bn", name: "Bengali", flag: "🇧🇩" },
    { code: "mr", name: "Marathi", flag: "🇮🇳" },
    { code: "ta", name: "Tamil", flag: "🇮🇳" },
    { code: "te", name: "Telugu", flag: "🇮🇳" },
    { code: "th", name: "Thai", flag: "🇹🇭" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
    { code: "ro", name: "Romanian", flag: "🇷🇴" },
    { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
    { code: "sci", name: "Science Jargon", flag: "🧑‍🔬" },
];

import type { GrammarCorrection } from "./gemini";
import type { IeltsConfig, IeltsAssessmentResult } from "./ielts";

export type AppMode = "immergo_immersive" | "immergo_teacher";

export type AppView =
    | "splash"
    | "missions"
    | "chat"
    | "summary"
    | "history"
    | "ielts-setup"
    | "ielts-chat"
    | "ielts-part1-chat"
    | "ielts-part2-chat"
    | "ielts-part3-chat"
    | "ielts-summary";

export interface SessionResult {
    incomplete?: boolean;
    score?: string;
    level?: string;
    notes?: string[];
    elapsedSeconds?: number;
    messageCount?: number;
    audioChunksSent?: number;
    tokenUsage?: {
        promptTokenCount: number;
        responseTokenCount: number;
        totalTokenCount: number;
    };
    grammarCorrections?: GrammarCorrection[];
    proficiencyObservations?: string[];
}

export type SessionDuration = 180 | 300 | 600 | 1800;

export interface AppState {
    view: AppView;
    selectedMission: Mission | null;
    selectedLanguage: string;
    selectedFromLanguage: string;
    selectedMode: AppMode;
    selectedVoice: string;
    sessionDuration: SessionDuration;
    sessionResult: SessionResult | null;
    ieltsConfig: IeltsConfig | null;
    ieltsResult: IeltsAssessmentResult | null;
}

/**
 * A completed session stored in history
 */
export interface SessionHistoryEntry {
    id: string;
    mission: Mission | null;
    language: string;
    fromLanguage: string;
    mode: AppMode;
    voice: string;
    result: SessionResult;
    completedAt: number; // Unix timestamp
    ieltsResult?: IeltsAssessmentResult;
    ieltsConfig?: IeltsConfig;
    // Sync fields (camelCase to match app conventions)
    syncVersion?: number;
    syncedAt?: number | null;
    deleted?: boolean;
    deletedAt?: number | null;
}
