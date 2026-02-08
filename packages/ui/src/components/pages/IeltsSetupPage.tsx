import { useState } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { IELTS_PART1_TOPICS } from "@immersive-lang/shared";
import type { IeltsConfig } from "@immersive-lang/shared";
import { Button, Card } from "@immersive-lang/ui/components/atoms";
import { VoiceSelector } from "@immersive-lang/ui/components/organisms";

export interface IeltsSetupPageProps {
    voice: string;
    onVoiceChange: (voice: string) => void;
    onStart: (config: IeltsConfig) => void;
    onBack: () => void;
}

export function IeltsSetupPage({ voice, onVoiceChange, onStart, onBack }: IeltsSetupPageProps) {
    const [topic, setTopic] = useState("");

    const handleTopicChipClick = (t: string) => {
        setTopic(t);
    };

    const handleStart = () => {
        if (!topic.trim()) return;
        onStart({ topic: topic.trim() });
    };

    return (
        <div className="max-w-175 mx-auto px-6 py-8 min-h-screen flex flex-col">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="self-start bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity mb-4"
            >
                <ArrowLeft size={24} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-3">
                    <BookOpen size={32} className="text-accent-secondary" />
                    <h1 className="text-3xl font-heading font-bold text-text-main">IELTS Speaking Part 1</h1>
                </div>
                <p className="text-text-sub text-lg max-w-125 mx-auto leading-relaxed">
                    Practice with an AI examiner. You'll be asked questions about familiar topics for 4-5 minutes, then
                    receive band scores across four official IELTS criteria.
                </p>
            </div>

            {/* Format Info */}
            <Card className="mb-8 text-sm text-text-sub">
                <h3 className="text-base font-bold text-text-main mb-2">Test Format</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Duration: 4-5 minutes</li>
                    <li>The examiner will introduce themselves and ask your name</li>
                    <li>Questions on 2-3 familiar topic areas, progressing in complexity</li>
                    <li>Give natural, conversational answers (not rehearsed monologues)</li>
                </ul>
            </Card>

            {/* Topic Selection */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-text-main mb-3 uppercase tracking-wide">
                    Choose a Topic
                </label>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Type a custom topic or select below..."
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                    {IELTS_PART1_TOPICS.map((t) => (
                        <button
                            key={t}
                            onClick={() => handleTopicChipClick(t)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                                topic === t
                                    ? "bg-accent-primary/15 border-accent-primary text-accent-primary"
                                    : "bg-surface border-glass-border text-text-sub hover:border-accent-primary/50 hover:text-text-main"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Voice Selector */}
            <Card className="mb-8">
                <VoiceSelector value={voice} onChange={onVoiceChange} />
            </Card>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Start Button */}
            <div className="text-center mb-16">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStart}
                    disabled={!topic.trim()}
                    className="min-w-70 flex-col py-6"
                >
                    <span className="text-xl font-extrabold mb-0.5 tracking-wide">Start Assessment</span>
                    <span className="text-sm opacity-90 italic">The examiner will begin the interview</span>
                </Button>
            </div>
        </div>
    );
}
