/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import {
  AlertCircle,
  Star,
  Github,
  Clock,
  MessageSquare,
  Mic,
  Coins,
  PenLine,
  Eye,
} from 'lucide-react';
import type { SessionResult } from '@immersive-lang/shared';
import { SCORE_LEVELS } from '@immersive-lang/shared';
import { Button } from '../atoms';
import { Card } from '../atoms';

export interface SummaryPageProps {
  result: SessionResult;
  onBackToMissions: () => void;
  onBackToHistory?: () => void;
}

function ScoreDisplay({ score }: { score: string }) {
  const scoreNum = parseInt(score, 10);
  const levels = [
    { id: 1, title: 'Tiro', stars: 1 },
    { id: 2, title: 'Proficiens', stars: 2 },
    { id: 3, title: 'Peritus', stars: 3 },
  ];

  const currentLevel = levels.find(l => l.id === scoreNum) || levels[0];
  const description = SCORE_LEVELS[scoreNum as keyof typeof SCORE_LEVELS]?.description || '';

  return (
    <div>
      <div className="flex justify-between items-end mb-4 h-20">
        {levels.map(level => {
          const isCurrent = level.id === scoreNum;
          return (
            <div
              key={level.id}
              className="flex-1 flex flex-col items-center gap-1 transition-all duration-300"
              style={{ opacity: isCurrent ? 1 : 0.3 }}
            >
              <div
                className="flex gap-0.5"
                style={{ color: isCurrent ? 'var(--color-accent-secondary)' : 'currentColor' }}
              >
                {Array.from({ length: level.stars }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <span
                className="font-heading"
                style={{
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  fontSize: isCurrent ? '1.1rem' : '0.9rem',
                  color: isCurrent ? 'var(--color-accent-primary)' : 'var(--color-text-main)',
                }}
              >
                {level.title}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-base opacity-80 italic mt-4 text-text-sub">({description})</p>
    </div>
  );
}

function BuildYourOwnSection() {
  return (
    <div className="mt-2 mb-8 p-8 rounded-2xl text-center border border-dashed border-accent-primary bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
      <h3 className="mb-2 text-accent-primary font-heading">Build Your Own Version</h3>
      <p className="mb-6 opacity-80 leading-relaxed text-text-sub">Add more missions or features</p>
      <a
        href="https://github.com/ZackAkil/immersive-language-learning-with-live-api"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-surface text-text-main py-3.5 px-7 border-2 border-dashed border-accent-primary rounded-xl no-underline font-extrabold shadow-sm transition-all duration-200 backdrop-blur-[10px] text-lg hover:translate-y-[-3px] hover:shadow-md hover:bg-bg"
      >
        <Github size={20} />
        Fork on GitHub
      </a>
    </div>
  );
}

export function SummaryPage({ result, onBackToMissions, onBackToHistory }: SummaryPageProps) {
  const isIncomplete = result.incomplete;
  const hasScore = !isIncomplete && result.score && result.score !== '0';

  return (
    <div className="max-w-[520px] mx-auto px-6 py-8 text-center min-h-screen flex flex-col">
      {isIncomplete ? (
        <>
          <h2 className="mt-8 text-text-sub font-heading">Mission Ended</h2>

          <div className="my-16 opacity-70">
            <AlertCircle size={64} strokeWidth={1.5} className="mx-auto" />
            <p className="mt-4 text-lg">
              You didn't complete the mission objectives.
              <br />
              No score awarded this time.
            </p>
          </div>

          <div className="flex-1" />
          <BuildYourOwnSection />
        </>
      ) : (
        <>
          <h2 className="mt-8 text-accent-secondary font-heading">Mission Accomplished!</h2>

          <div className="my-6">
            {hasScore ? (
              <ScoreDisplay score={result.score!} />
            ) : (
              <p className="text-xl opacity-80">Practice session complete!</p>
            )}
          </div>

          {result.notes && result.notes.length > 0 && (
            <Card className="text-left">
              <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading">Feedback</h4>
              <ul className="pl-6 text-text-sub">
                {result.notes.map((note, i) => (
                  <li key={i} className="mb-2">
                    {note}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.grammarCorrections && result.grammarCorrections.length > 0 && (
            <Card className="text-left mt-4">
              <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading flex items-center gap-2">
                <PenLine size={18} className="text-accent-primary" />
                Grammar Corrections
              </h4>
              <div className="mt-3 space-y-4">
                {result.grammarCorrections.map((gc, i) => (
                  <div key={i} className="rounded-xl bg-bg p-3">
                    <p className="text-sm text-text-sub mb-1">
                      <span className="line-through text-destructive/80">{gc.user_said}</span>
                    </p>
                    <p className="text-xs text-text-sub opacity-70 mb-1">{gc.issue}</p>
                    <p className="text-sm font-bold text-green-600">{gc.correction}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-sub opacity-60">
                {result.grammarCorrections.length} correction
                {result.grammarCorrections.length !== 1 ? 's' : ''} noted
              </p>
            </Card>
          )}

          {result.proficiencyObservations && result.proficiencyObservations.length > 0 && (
            <Card className="text-left mt-4">
              <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading flex items-center gap-2">
                <Eye size={18} className="text-accent-primary" />
                Proficiency Observations
              </h4>
              <ul className="pl-6 mt-2 text-text-sub">
                {result.proficiencyObservations.map((obs, i) => (
                  <li key={i} className="mb-2">
                    {obs}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(result.elapsedSeconds || result.messageCount || result.tokenUsage) && (
            <Card className="text-left mt-4">
              <h4 className="border-b-2 border-bg pb-2 text-text-main font-heading">
                Session Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                {result.elapsedSeconds != null && result.elapsedSeconds > 0 && (
                  <div className="flex items-center gap-2 text-text-sub">
                    <Clock size={16} className="opacity-50 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-text-main">
                        {Math.floor(result.elapsedSeconds / 60)}:
                        {String(Math.floor(result.elapsedSeconds % 60)).padStart(2, '0')}
                      </span>{' '}
                      elapsed
                    </span>
                  </div>
                )}
                {result.messageCount != null && result.messageCount > 0 && (
                  <div className="flex items-center gap-2 text-text-sub">
                    <MessageSquare size={16} className="opacity-50 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-text-main">
                        {result.messageCount.toLocaleString()}
                      </span>{' '}
                      messages
                    </span>
                  </div>
                )}
                {result.audioChunksSent != null && result.audioChunksSent > 0 && (
                  <div className="flex items-center gap-2 text-text-sub">
                    <Mic size={16} className="opacity-50 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-text-main">
                        {result.audioChunksSent.toLocaleString()}
                      </span>{' '}
                      audio chunks
                    </span>
                  </div>
                )}
                {result.tokenUsage && (
                  <div className="flex items-center gap-2 text-text-sub">
                    <Coins size={16} className="opacity-50 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-text-main">
                        {result.tokenUsage.totalTokenCount.toLocaleString()}
                      </span>{' '}
                      tokens
                    </span>
                  </div>
                )}
              </div>
              {result.tokenUsage && (
                <div className="mt-2 pt-2 border-t border-bg text-xs text-text-sub opacity-70">
                  {result.tokenUsage.promptTokenCount.toLocaleString()} prompt,{' '}
                  {result.tokenUsage.candidatesTokenCount.toLocaleString()} response
                </div>
              )}
            </Card>
          )}

          <div className="flex-1" />
          <BuildYourOwnSection />
        </>
      )}

      {onBackToHistory ? (
        <Button
          variant="primary"
          size="lg"
          onClick={onBackToHistory}
          className="w-full mb-16 uppercase tracking-wide"
        >
          Back to History
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={onBackToMissions}
          className="w-full mb-16 uppercase tracking-wide"
        >
          Back to mission list
        </Button>
      )}
    </div>
  );
}
