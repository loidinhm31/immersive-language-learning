import { useState } from "react";
import { History, ChevronRight, BookOpen } from "lucide-react";
import type { AppMode, Mission, SessionDuration } from "@immersive-lang/shared";
import { Button, Card } from "@immersive-lang/ui/components/atoms";
import {
    LanguageSelector,
    MissionCard,
    ModeSelector,
    SessionDurationSelector,
    VoiceSelector,
} from "@immersive-lang/ui/components/organisms";

// Import missions data - this will be bundled
const MISSIONS_DATA: Mission[] = [
    {
        id: 10,
        title: "Free Talk",
        difficulty: "Easy",
        desc: 'Chat freely about anything. Say "I have to go" when you want to end.',
        target_role: "Friendly Conversation Partner",
        freestyle: true,
    },
    {
        id: 0,
        title: "Say Hello",
        difficulty: "Easy",
        desc: "Introduce yourself and ask how they are.",
        target_role: "Exited Neighbor",
    },
    {
        id: 5,
        title: "Order a Coffee",
        difficulty: "Easy",
        desc: "Order a coffee and a pastry to go.",
        target_role: "Flustered/Panicked Barista",
    },
    {
        id: 1,
        title: "Buy a bus ticket",
        difficulty: "Medium",
        desc: "You need to get to the city center.",
        target_role: "Angry Bus Driver",
    },
    {
        id: 2,
        title: "Order dinner with Jack",
        difficulty: "Medium",
        desc: "Your flatmate is hungry, find out what he wants.",
        target_role: "Indecisive Flatmate",
    },
    {
        id: 6,
        title: "Return a Shirt",
        difficulty: "Medium",
        desc: "The size is wrong, you want a refund.",
        target_role: "Happy Shop Assistant",
    },
    {
        id: 3,
        title: "Ask for directions",
        difficulty: "Hard",
        desc: "You are lost in Paris.",
        target_role: "Local Parisian",
    },
    {
        id: 8,
        title: "Market Bargaining",
        difficulty: "Hard",
        desc: "Buy a souvenir for a cheaper price.",
        target_role: "Loud Street Vendor",
    },
    {
        id: 4,
        title: "Negotiate rent",
        difficulty: "Expert",
        desc: "The landlord is raising the price.",
        target_role: "Strict Landlord",
    },
    {
        id: 9,
        title: "Job Interview",
        difficulty: "Expert",
        desc: "Explain your strengths and weaknesses.",
        target_role: "Company Recruiter",
    },
];

export interface MissionsPageProps {
    fromLanguage: string;
    toLanguage: string;
    mode: AppMode;
    voice: string;
    sessionDuration: SessionDuration;
    onFromLanguageChange: (lang: string) => void;
    onToLanguageChange: (lang: string) => void;
    onModeChange: (mode: AppMode) => void;
    onVoiceChange: (voice: string) => void;
    onSessionDurationChange: (duration: SessionDuration) => void;
    onMissionSelect: (mission: Mission) => void;
    onViewHistory?: () => void;
    onIeltsAssessment?: () => void;
}

export function MissionsPage({
    fromLanguage,
    toLanguage,
    mode,
    voice,
    sessionDuration,
    onFromLanguageChange,
    onToLanguageChange,
    onModeChange,
    onVoiceChange,
    onSessionDurationChange,
    onMissionSelect,
    onViewHistory,
    onIeltsAssessment,
}: MissionsPageProps) {
    const [missions] = useState<Mission[]>(MISSIONS_DATA);

    return (
        <div className="max-w-250 mx-auto px-6 py-8">
            {/* HUD Panel */}
            <Card className="grid grid-cols-2 gap-8 p-6 max-w-225 mx-auto mb-16">
                <LanguageSelector
                    label="I speak"
                    value={fromLanguage}
                    onChange={onFromLanguageChange}
                    variant="default"
                />
                <LanguageSelector
                    label="I want to learn"
                    value={toLanguage}
                    onChange={onToLanguageChange}
                    variant="accent"
                />
                <div className="col-span-2 mt-4 pt-6 border-t border-white/5">
                    <ModeSelector value={mode} onChange={onModeChange} />
                </div>
                <div className="col-span-2 mt-4 pt-6 border-t border-white/5">
                    <SessionDurationSelector value={sessionDuration} onChange={onSessionDurationChange} />
                </div>
                <VoiceSelector
                    value={voice}
                    onChange={onVoiceChange}
                    className="col-span-2 mt-4 pt-6 border-t border-white/5"
                />
            </Card>

            {/* Section Title */}
            <div className="mb-4 text-center">
                <div className="flex items-center justify-center gap-4 mb-1">
                    <h2 className="text-4xl tracking-tight font-heading font-bold text-text-main">Choose Your Quest</h2>
                    {onViewHistory && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onViewHistory}
                            className="text-text-sub hover:text-accent-primary"
                        >
                            <History size={18} className="mr-1" />
                            History
                        </Button>
                    )}
                </div>
                <p className="opacity-70 text-lg text-text-sub">Select a scenario to begin your immersive practice</p>
            </div>

            {/* IELTS Assessment Card */}
            {onIeltsAssessment && (
                <div className="mb-8">
                    <button
                        onClick={onIeltsAssessment}
                        className="w-full text-left cursor-pointer rounded-2xl border-2 border-dashed border-accent-secondary bg-accent-secondary/5 p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-accent-secondary/80"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent-secondary/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen size={24} className="text-accent-secondary" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-heading font-bold text-text-main">IELTS Speaking</h3>
                                    <span className="text-xs font-bold uppercase tracking-wider text-accent-secondary bg-accent-secondary/10 px-2 py-0.5 rounded-full">
                                        Assessment
                                    </span>
                                </div>
                                <p className="text-base opacity-70 text-text-sub">
                                    Practice with an AI examiner and get band scores (Fluency, Lexical, Grammar,
                                    Pronunciation)
                                </p>
                            </div>
                            <ChevronRight size={24} className="text-accent-secondary opacity-50 flex-shrink-0" />
                        </div>
                    </button>
                </div>
            )}

            {/* Mission Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mb-8">
                {missions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} onClick={() => onMissionSelect(mission)} />
                ))}
            </div>

            {/* Developer Panel */}
            <Card padding="none" className="mt-6 mb-8 overflow-hidden shadow-md">
                {/* Terminal Header */}
                <div className="bg-black/5 px-5 py-3 border-b border-glass-border flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-80" />
                    </div>
                    <div className="font-mono text-xs opacity-50 ml-2.5 text-text-main">developer_mode.sh</div>
                </div>
            </Card>
        </div>
    );
}
