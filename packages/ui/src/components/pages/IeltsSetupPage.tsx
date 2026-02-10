import { useState } from "react";
import { ArrowLeft, BookOpen, MessageSquare, MessagesSquare, Plus, X } from "lucide-react";
import { IELTS_PART1_TOPICS, IELTS_PART2_CUE_CARDS, IELTS_PART3_TOPICS } from "@immersive-lang/shared";
import type { IeltsConfig, IeltsPart, IeltsCueCard } from "@immersive-lang/shared";
import { Button, Card } from "@immersive-lang/ui/components/atoms";
import { VoiceSelector } from "@immersive-lang/ui/components/organisms";

const PART_INFO: Record<
    IeltsPart,
    { title: string; subtitle: string; icon: typeof BookOpen; description: string; format: string[] }
> = {
    1: {
        title: "Part 1",
        subtitle: "Interview",
        icon: MessageSquare,
        description:
            "Practice with an AI examiner. You'll be asked questions about familiar topics for 4-5 minutes, then receive band scores across four official IELTS criteria.",
        format: [
            "Duration: 4-5 minutes",
            "The examiner will introduce themselves and ask your name",
            "Questions on 2-3 familiar topic areas, progressing in complexity",
            "Give natural, conversational answers (not rehearsed monologues)",
        ],
    },
    2: {
        title: "Part 2",
        subtitle: "Individual Long Turn",
        icon: BookOpen,
        description:
            "You'll receive a topic card with prompts. After 1 minute of preparation, speak for 1-2 minutes on the topic, then answer 1-2 follow-up questions.",
        format: [
            "Duration: 3-4 minutes total",
            "1 minute preparation time to plan your response",
            "Speak for 1-2 minutes on the given topic (monologue)",
            "The examiner may ask 1-2 brief follow-up questions",
            "Address all bullet points on the task card",
        ],
    },
    3: {
        title: "Part 3",
        subtitle: "Two-Way Discussion",
        icon: MessagesSquare,
        description:
            "Engage in a deeper discussion with the examiner on abstract topics. You'll need to analyze, compare, speculate, and justify your opinions.",
        format: [
            "Duration: 4-5 minutes",
            "More abstract, analytical questions on the topic area",
            "Discuss, compare, and evaluate different perspectives",
            "Justify your opinions with examples and reasoning",
            "Questions build in complexity throughout",
        ],
    },
};

export interface IeltsSetupPageProps {
    voice: string;
    onVoiceChange: (voice: string) => void;
    onStart: (config: IeltsConfig) => void;
    onBack: () => void;
}

export function IeltsSetupPage({ voice, onVoiceChange, onStart, onBack }: IeltsSetupPageProps) {
    const [selectedPart, setSelectedPart] = useState<IeltsPart>(1);
    const [topic, setTopic] = useState("");
    const [selectedCueCard, setSelectedCueCard] = useState<IeltsCueCard | null>(null);
    const [customMode, setCustomMode] = useState(false);
    const [customTopic, setCustomTopic] = useState("");
    const [customBulletPoints, setCustomBulletPoints] = useState(["", "", ""]);
    const [customFollowUp, setCustomFollowUp] = useState("");

    const partInfo = PART_INFO[selectedPart];

    const handleTopicChipClick = (t: string) => {
        setTopic(t);
    };

    const handleCueCardSelect = (card: IeltsCueCard) => {
        setSelectedCueCard(card);
        setTopic(card.topic);
    };

    const canStart = () => {
        if (selectedPart === 2) {
            if (customMode) {
                return (
                    customTopic.trim().length > 0 &&
                    customFollowUp.trim().length > 0 &&
                    customBulletPoints.filter((bp) => bp.trim().length > 0).length >= 2
                );
            }
            return selectedCueCard !== null;
        }
        return topic.trim().length > 0;
    };

    const handleStart = () => {
        if (!canStart()) return;

        if (selectedPart === 2) {
            if (customMode) {
                const cueCard: IeltsCueCard = {
                    topic: customTopic.trim(),
                    bulletPoints: customBulletPoints.filter((bp) => bp.trim().length > 0).map((bp) => bp.trim()),
                    followUp: customFollowUp.trim(),
                };
                onStart({ part: 2, topic: cueCard.topic, cueCard });
            } else if (selectedCueCard) {
                onStart({ part: 2, topic: selectedCueCard.topic, cueCard: selectedCueCard });
            }
        } else {
            onStart({ part: selectedPart, topic: topic.trim() });
        }
    };

    const handlePartChange = (part: IeltsPart) => {
        setSelectedPart(part);
        setTopic("");
        setSelectedCueCard(null);
        setCustomMode(false);
        setCustomTopic("");
        setCustomBulletPoints(["", "", ""]);
        setCustomFollowUp("");
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
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 mb-3">
                    <partInfo.icon size={32} className="text-accent-secondary" />
                    <h1 className="text-3xl font-heading font-bold text-text-main">IELTS Speaking {partInfo.title}</h1>
                </div>
                <p className="text-text-sub text-lg max-w-125 mx-auto leading-relaxed">{partInfo.description}</p>
            </div>

            {/* Part Selector */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {([1, 2, 3] as IeltsPart[]).map((part) => {
                    const info = PART_INFO[part];
                    const isSelected = selectedPart === part;
                    return (
                        <button
                            key={part}
                            onClick={() => handlePartChange(part)}
                            className={`rounded-xl p-3 text-center border-2 transition-all cursor-pointer ${
                                isSelected
                                    ? "border-accent-primary bg-accent-primary/10"
                                    : "border-glass-border bg-surface hover:border-accent-primary/40"
                            }`}
                        >
                            <div
                                className={`text-lg font-heading font-bold ${isSelected ? "text-accent-primary" : "text-text-main"}`}
                            >
                                {info.title}
                            </div>
                            <div className={`text-xs ${isSelected ? "text-accent-primary/80" : "text-text-sub"}`}>
                                {info.subtitle}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Format Info */}
            <Card className="mb-6 text-sm text-text-sub">
                <h3 className="text-base font-bold text-text-main mb-2">Test Format</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {partInfo.format.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </Card>

            {/* Part 1: Topic Selection */}
            {selectedPart === 1 && (
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
            )}

            {/* Part 2: Cue Card Selection */}
            {selectedPart === 2 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-text-main uppercase tracking-wide">
                            {customMode ? "Create Your Own Task Card" : "Choose a Task Card"}
                        </label>
                        <button
                            onClick={() => setCustomMode(!customMode)}
                            className="text-sm text-accent-primary hover:text-accent-primary/80 cursor-pointer bg-transparent border-none font-medium transition-colors"
                        >
                            {customMode ? "Back to Predefined Cards" : "Create Your Own"}
                        </button>
                    </div>

                    {customMode ? (
                        <div className="space-y-4">
                            {/* Topic */}
                            <div>
                                <label className="block text-xs font-medium text-text-sub mb-1.5">Topic</label>
                                <input
                                    type="text"
                                    value={customTopic}
                                    onChange={(e) => setCustomTopic(e.target.value)}
                                    placeholder="Describe a ..."
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                                />
                            </div>

                            {/* Bullet Points */}
                            <div>
                                <label className="block text-xs font-medium text-text-sub mb-1.5">
                                    Bullet Points ({customBulletPoints.filter((bp) => bp.trim()).length} of{" "}
                                    {customBulletPoints.length})
                                </label>
                                <div className="space-y-2">
                                    {customBulletPoints.map((bp, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={bp}
                                                onChange={(e) => {
                                                    const updated = [...customBulletPoints];
                                                    updated[i] = e.target.value;
                                                    setCustomBulletPoints(updated);
                                                }}
                                                placeholder="what/who/where/when/how..."
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-glass-border text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all text-sm"
                                            />
                                            {customBulletPoints.length > 2 && (
                                                <button
                                                    onClick={() =>
                                                        setCustomBulletPoints(
                                                            customBulletPoints.filter((_, j) => j !== i),
                                                        )
                                                    }
                                                    className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-text-sub hover:text-red-400 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {customBulletPoints.length < 5 && (
                                    <button
                                        onClick={() => setCustomBulletPoints([...customBulletPoints, ""])}
                                        className="mt-2 flex items-center gap-1.5 text-sm text-accent-primary hover:text-accent-primary/80 bg-transparent border-none cursor-pointer font-medium transition-colors"
                                    >
                                        <Plus size={14} />
                                        Add point
                                    </button>
                                )}
                            </div>

                            {/* Follow-up */}
                            <div>
                                <label className="block text-xs font-medium text-text-sub mb-1.5">Follow-up</label>
                                <input
                                    type="text"
                                    value={customFollowUp}
                                    onChange={(e) => setCustomFollowUp(e.target.value)}
                                    placeholder="and explain ..."
                                    className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {IELTS_PART2_CUE_CARDS.map((card, i) => {
                                const isSelected = selectedCueCard?.topic === card.topic;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleCueCardSelect(card)}
                                        className={`w-full text-left rounded-xl p-4 border-2 transition-all cursor-pointer ${
                                            isSelected
                                                ? "border-accent-primary bg-accent-primary/5"
                                                : "border-glass-border bg-surface hover:border-accent-primary/40"
                                        }`}
                                    >
                                        <p
                                            className={`text-sm font-bold mb-1 ${isSelected ? "text-accent-primary" : "text-text-main"}`}
                                        >
                                            {card.topic}
                                        </p>
                                        <p className="text-xs text-text-sub">{card.bulletPoints.join(" / ")}</p>
                                        <p className="text-xs text-accent-secondary/70 mt-1 italic">{card.followUp}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Part 3: Discussion Theme Selection */}
            {selectedPart === 3 && (
                <div className="mb-6">
                    <label className="block text-sm font-bold text-text-main mb-3 uppercase tracking-wide">
                        Choose a Discussion Theme
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Type a custom theme or select below..."
                        className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-text-main placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all"
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                        {IELTS_PART3_TOPICS.map((t) => (
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
            )}

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
                    disabled={!canStart()}
                    className="min-w-70 flex-col py-6"
                >
                    <span className="text-xl font-extrabold mb-0.5 tracking-wide">Start Assessment</span>
                    <span className="text-sm opacity-90 italic">
                        {selectedPart === 2
                            ? "You'll see the task card first"
                            : "The examiner will begin the interview"}
                    </span>
                </Button>
            </div>
        </div>
    );
}
