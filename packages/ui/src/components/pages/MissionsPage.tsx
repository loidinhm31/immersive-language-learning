/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useState } from 'react';
import type { AppMode, Mission, SessionDuration } from '@immersive-lang/shared';
import { Card } from '../atoms';
import { LanguageSelector, MissionCard, ModeSelector, SessionDurationSelector } from '../organisms';

// Import missions data - this will be bundled
const MISSIONS_DATA: Mission[] = [
  {
    id: 10,
    title: 'Free Talk',
    difficulty: 'Easy',
    desc: 'Chat freely about anything. Say "I have to go" when you want to end.',
    target_role: 'Friendly Conversation Partner',
    freestyle: true,
  },
  {
    id: 0,
    title: 'Say Hello',
    difficulty: 'Easy',
    desc: 'Introduce yourself and ask how they are.',
    target_role: 'Exited Neighbor',
  },
  {
    id: 5,
    title: 'Order a Coffee',
    difficulty: 'Easy',
    desc: 'Order a coffee and a pastry to go.',
    target_role: 'Flustered/Panicked Barista',
  },
  {
    id: 1,
    title: 'Buy a bus ticket',
    difficulty: 'Medium',
    desc: 'You need to get to the city center.',
    target_role: 'Angry Bus Driver',
  },
  {
    id: 2,
    title: 'Order dinner with Jack',
    difficulty: 'Medium',
    desc: 'Your flatmate is hungry, find out what he wants.',
    target_role: 'Indecisive Flatmate',
  },
  {
    id: 6,
    title: 'Return a Shirt',
    difficulty: 'Medium',
    desc: 'The size is wrong, you want a refund.',
    target_role: 'Happy Shop Assistant',
  },
  {
    id: 3,
    title: 'Ask for directions',
    difficulty: 'Hard',
    desc: 'You are lost in Paris.',
    target_role: 'Local Parisian',
  },
  {
    id: 8,
    title: 'Market Bargaining',
    difficulty: 'Hard',
    desc: 'Buy a souvenir for a cheaper price.',
    target_role: 'Loud Street Vendor',
  },
  {
    id: 4,
    title: 'Negotiate rent',
    difficulty: 'Expert',
    desc: 'The landlord is raising the price.',
    target_role: 'Strict Landlord',
  },
  {
    id: 9,
    title: 'Job Interview',
    difficulty: 'Expert',
    desc: 'Explain your strengths and weaknesses.',
    target_role: 'Company Recruiter',
  },
];

export interface MissionsPageProps {
  fromLanguage: string;
  toLanguage: string;
  mode: AppMode;
  sessionDuration: SessionDuration;
  onFromLanguageChange: (lang: string) => void;
  onToLanguageChange: (lang: string) => void;
  onModeChange: (mode: AppMode) => void;
  onSessionDurationChange: (duration: SessionDuration) => void;
  onMissionSelect: (mission: Mission) => void;
}

export function MissionsPage({
  fromLanguage,
  toLanguage,
  mode,
  sessionDuration,
  onFromLanguageChange,
  onToLanguageChange,
  onModeChange,
  onSessionDurationChange,
  onMissionSelect,
}: MissionsPageProps) {
  const [missions] = useState<Mission[]>(MISSIONS_DATA);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      {/* HUD Panel */}
      <Card className="grid grid-cols-2 gap-8 p-6 max-w-[900px] mx-auto mb-16">
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
      </Card>

      {/* Section Title */}
      <div className="mb-4 text-center">
        <h2 className="text-4xl tracking-tight mb-1 font-heading font-bold text-text-main">
          Choose Your Quest
        </h2>
        <p className="opacity-70 text-lg text-text-sub">
          Select a scenario to begin your immersive practice
        </p>
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mb-8">
        {missions.map(mission => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClick={() => onMissionSelect(mission)}
          />
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
          <div className="font-mono text-xs opacity-50 ml-2.5 text-text-main">
            developer_mode.sh
          </div>
        </div>

        <div className="p-8 flex items-center justify-between gap-8 flex-wrap">
          <div className="flex-[2] min-w-[300px]">
            <h3 className="font-mono text-accent-primary mb-2 text-xl flex items-center gap-2.5">
              <span className="opacity-50">&gt;</span> Deploy Your Own Version
            </h3>
            <p className="opacity-70 text-base leading-relaxed max-w-[500px] text-text-sub">
              Launch your own personalized instance in just 1-click. Customize scenarios, add new
              languages, or rewrite the world.
            </p>
          </div>

          <div className="flex-1 flex justify-end gap-4">
            <a
              href="https://deploy.cloud.run/?git_repo=https://github.com/ZackAkil/immersive-language-learning-with-live-api&utm_source=github&utm_medium=unpaidsoc&utm_campaign=FY-Q1-global-cloud-ai-starter-apps&utm_content=immergo-app&utm_term=-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 px-8 rounded-xl text-[#1a73e8] bg-[rgba(26,115,232,0.05)] no-underline font-extrabold shadow-[0_4px_15px_rgba(26,115,232,0.1)] transition-all duration-200 text-lg whitespace-nowrap border-2 border-dashed border-[#1a73e8] hover:translate-y-[-3px] hover:shadow-[0_8px_25px_rgba(26,115,232,0.2)] hover:bg-[rgba(26,115,232,0.1)]"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/google_cloud_48dp.png"
                width={24}
                height={24}
                alt="Cloud Run"
              />
              Deploy to Cloud Run
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
