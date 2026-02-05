/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Square } from 'lucide-react';
import type {
  Mission,
  AppMode,
  SessionResult,
  CompleteMissionArgs,
  SessionDuration,
} from '@immersive-lang/shared';
import { Button } from '../atoms/Button';
import { AudioVisualizer } from '../molecules/AudioVisualizer';
import { LiveTranscript, type LiveTranscriptRef } from '../molecules/LiveTranscript';
import { SessionTimer } from '../molecules/SessionTimer';
import { TokenUsage } from '../molecules/TokenUsage';
import { useGeminiLive } from '../../hooks/useGeminiLive';

/**
 * Plays an audio file safely, handling the AbortError that occurs when
 * audio is interrupted by component unmount or re-render.
 */
function playSound(audio: HTMLAudioElement): void {
  // Reset to start in case it was played before
  audio.currentTime = 0;
  // Use the play promise to handle interruptions gracefully
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      // Only log non-abort errors (AbortError is expected during unmount/navigation)
      if (e.name !== 'AbortError') {
        console.error('Failed to play sound:', e);
      }
    });
  }
}

export interface ChatPageProps {
  mission: Mission;
  language: string;
  fromLanguage: string;
  mode: AppMode;
  sessionDuration: SessionDuration;
  onBack: () => void;
  onComplete: (result: SessionResult) => void;
}

function buildSystemInstructions(
  mission: Mission,
  language: string,
  fromLanguage: string,
  mode: AppMode
): string {
  const targetRole = mission.target_role || 'a local native speaker';
  const missionTitle = mission.title;
  const missionDesc = mission.desc;

  if (mode === 'immergo_teacher') {
    return `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to be a PROACTIVE LANGUAGE MENTOR while staying in character as ${targetRole}.

TEACHING PROTOCOL:
1. **Gentle Corrections**: If the user makes a clear mistake, respond in character first, then briefly provide a friendly correction or a "more natural way to say that" in ${fromLanguage}.
2. **Vocabulary Boost**: Every few turns, suggest 1-2 relevant words or idioms in ${language} that fit the current situation and explain their meaning in ${fromLanguage}.
3. **Mini-Checks**: Occasionally (every 3-4 turns), ask the user a quick "How would you say...?" question in ${fromLanguage} related to the mission to test their recall.
4. **Scaffolding**: If the user is hesitant, provide the start of a sentence in ${language} or give them two options to choose from to keep the momentum.
5. **Mixed-Language Support**: Use ${fromLanguage} for teaching moments, but always pivot back to ${language} to maintain the immersive feel.

INTERACTION GUIDELINES:
1. Prioritize the flow of conversation—don't let the teaching feel like a lecture.
2. Utilize the proactive audio feature: do not respond until the user has clearly finished their thought.

MISSION COMPLETION:
When the user has successfully achieved the mission objective:
1. Give a warm congratulatory message in ${language}, then translate the praise into ${fromLanguage}.
2. THEN call the "complete_mission" tool.
3. Set 'score' to 0 (Zero) as this is a learning-focused practice session.
4. Provide 3 specific takeaways (grammar tips or new words) in the feedback list in ${fromLanguage}.
`;
  }

  // Immersive Mode (Default)
  return `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to play your role (${targetRole}) naturally. Do not act as an AI assistant. Act as the person.
Speak in the accent and tone of the role.

INTERACTION GUIDELINES:
1. It is up to you if you want to directly speak back, or speak out what you think the user is saying in your native language before responding.
2. Utilising the proactive audio feature, do not respond until it is necessary (i.e. the user has finished their turn).
3. Be helpful but strict about language practice. It is just like speaking to a multilingual person.
4. You cannot proceed without the user speaking the target language (${language}) themselves.
5. If you need to give feedback, corrections, or translations, use the user's native language (${fromLanguage}).

NO FREE RIDES POLICY:
If the user asks for help in ${fromLanguage} (e.g., "please can you repeat"), you MUST NOT simply answer.
Instead, force them to say the phrase in the target language (${language}).
For example, say: "You mean to say [Insert Translation in ${language}]" (provided in ${fromLanguage}) and wait for them to repeat it.
Do not continue the conversation until they attempt the phrase in ${language}.

MISSION COMPLETION:
When the user has successfully achieved the mission objective declared in the scenario:
1. Speak a brief congratulatory message (in character) and say goodbye.
2. THEN call the "complete_mission" tool.
3. Assign a score based on strict criteria: 1 for struggling/English reliance (Tiro), 2 for capable but imperfect (Proficiens), 3 for native-level fluency (Peritus).
4. Provide 3 specific pointers or compliments in the feedback list (in the user's native language: ${fromLanguage}).
`;
}

export function ChatPage({
  mission,
  language,
  fromLanguage,
  mode,
  sessionDuration,
  onBack,
  onComplete,
}: ChatPageProps) {
  const [isActive, setIsActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [showRateLimitDialog, setShowRateLimitDialog] = useState(false);
  const transcriptRef = useRef<{ transcriptRef?: LiveTranscriptRef } | null>(null);

  // Preload audio files to avoid AbortError when playing during state changes
  const sounds = useMemo(() => {
    const startSound = new Audio('/start-bell.mp3');
    startSound.volume = 0.6;
    startSound.preload = 'auto';

    const winnerSound = new Audio('/winner-bell.mp3');
    winnerSound.volume = 0.6;
    winnerSound.preload = 'auto';

    return { startSound, winnerSound };
  }, []);

  const handleMissionComplete = useCallback(
    (args: CompleteMissionArgs) => {
      console.log('🏆 Mission Complete!', args);

      // Play winner sound using preloaded audio
      playSound(sounds.winnerSound);

      // Map score to level
      const levels: Record<number, string> = { 1: 'Tiro', 2: 'Proficiens', 3: 'Peritus' };
      const level = levels[args.score] || 'Proficiens';

      // Delay to allow final audio to play
      setTimeout(() => {
        onComplete({
          score: args.score.toString(),
          level,
          notes: args.feedback_pointers,
        });
      }, 2500);
    },
    [onComplete, sounds.winnerSound]
  );

  const handleTranscriptInput = useCallback((text: string, finished: boolean) => {
    const ref = transcriptRef.current?.transcriptRef;
    if (ref) {
      ref.addInputTranscript(text, finished);
    }
  }, []);

  const handleTranscriptOutput = useCallback((text: string, finished: boolean) => {
    const ref = transcriptRef.current?.transcriptRef;
    if (ref) {
      ref.addOutputTranscript(text, finished);
    }
  }, []);

  const handleTurnComplete = useCallback(() => {
    const ref = transcriptRef.current?.transcriptRef;
    if (ref) {
      ref.finalizeAll();
    }
  }, []);

  const handleError = useCallback((error: Error & { status?: number }) => {
    // Reset active state when session errors out
    setIsActive(false);

    if (error.status === 429) {
      setShowRateLimitDialog(true);
    } else {
      // Show error message to user
      alert('Session error: ' + error.message);
    }
  }, []);

  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    audioContext,
    audioSource,
    playerAudioContext,
    playerGainNode,
    remainingTime,
    sessionDuration: currentSessionDuration,
    tokenUsage,
  } = useGeminiLive({
    onTranscriptInput: handleTranscriptInput,
    onTranscriptOutput: handleTranscriptOutput,
    onTurnComplete: handleTurnComplete,
    onMissionComplete: handleMissionComplete,
    onError: handleError,
  });

  // Update status text
  useEffect(() => {
    if (isConnecting) {
      setConnectionStatus('Connecting...');
    } else if (isConnected) {
      setConnectionStatus('Connected and ready to speak');
    } else {
      setConnectionStatus('');
    }
  }, [isConnecting, isConnected]);

  const handleStartStop = async () => {
    if (isActive) {
      // Stop session
      disconnect();
      setIsActive(false);
      onComplete({ incomplete: true });
    } else {
      // Start session
      setIsActive(true);
      try {
        const systemInstructions = buildSystemInstructions(mission, language, fromLanguage, mode);
        const enableTranscription = mode === 'immergo_teacher';
        await connect(
          systemInstructions,
          enableTranscription,
          enableTranscription,
          sessionDuration
        );

        // Play start sound using preloaded audio
        playSound(sounds.startSound);
      } catch {
        setIsActive(false);
      }
    }
  };

  const handleBackClick = () => {
    disconnect();
    onBack();
  };

  const isTeacherMode = mode === 'immergo_teacher';

  return (
    <div className="relative min-h-screen flex flex-col max-w-[520px] mx-auto px-6 pb-8">
      {/* Back Button */}
      <button
        onClick={handleBackClick}
        className="absolute top-4 left-4 bg-transparent border-none cursor-pointer p-2 rounded-full flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity z-10"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Session Timer */}
      {isActive && isConnected && (
        <SessionTimer
          remainingTime={remainingTime}
          sessionDuration={currentSessionDuration}
          className="absolute top-4 right-4 z-10"
        />
      )}

      {/* Header */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl mb-0.5 font-heading font-bold text-text-main">
          {mission.target_role || 'Target Person'}
        </h2>

        {/* Language Pill */}
        <div className="text-sm font-bold text-text-sub mb-4 inline-flex items-center gap-2 bg-black/[0.04] py-1 px-3 rounded-full border border-black/5">
          <span>{fromLanguage}</span>
          <span className="opacity-30 font-normal">➔</span>
          <span className="text-accent-primary">{language}</span>
        </div>

        {/* Mission Info */}
        <div className="rounded-2xl py-4 px-6 inline-block mt-4 max-w-[800px]">
          <p className="text-xl font-bold text-accent-secondary m-0">{mission.title}</p>
          <p className="text-base opacity-90 mt-1 text-text-main">{mission.desc}</p>
        </div>

        {/* Teacher Mode Hint */}
        {isTeacherMode && (
          <div className="mt-6 text-sm bg-surface text-accent-primary py-2 px-4 rounded-full inline-flex items-center gap-1.5 border border-accent-primary shadow-sm">
            <span>
              You can ask for <strong>translations</strong> & <strong>explanations</strong> at any
              time.
            </span>
          </div>
        )}
      </div>

      {/* Visualizers and Transcript */}
      <div
        className="flex-1 flex flex-col items-center w-full"
        style={{
          justifyContent: isTeacherMode ? 'space-between' : 'center',
          gap: isTeacherMode ? '10px' : '40px',
        }}
      >
        {/* Model Visualizer */}
        <div className="w-full h-[120px] flex items-center justify-center flex-shrink-0">
          <AudioVisualizer audioContext={playerAudioContext} sourceNode={playerGainNode} />
        </div>

        {/* Transcript (Teacher Mode only) */}
        {isTeacherMode && (
          <div
            ref={el => {
              transcriptRef.current = el as { transcriptRef?: LiveTranscriptRef } | null;
            }}
            className="w-full h-[250px] my-2.5 relative"
          >
            <LiveTranscript />
          </div>
        )}

        {/* User Visualizer */}
        <div className="w-full h-[120px] flex items-center justify-center flex-shrink-0">
          <AudioVisualizer audioContext={audioContext} sourceNode={audioSource} />
        </div>
      </div>

      {/* CTA Button */}
      <div className="mb-16 flex flex-col gap-6 items-center">
        <Button
          variant={isActive ? 'danger' : 'primary'}
          size="lg"
          onClick={handleStartStop}
          isLoading={isConnecting}
          className="min-w-[280px] flex-col py-6"
        >
          {isActive ? (
            <span className="flex items-center gap-3">
              <Square size={20} />
              <span className="font-extrabold text-lg tracking-wide uppercase">End Mission</span>
            </span>
          ) : (
            <>
              <span className="text-xl font-extrabold mb-0.5 tracking-wide">Start Mission</span>
              <span className="text-sm opacity-90 italic">You start the conversation!</span>
            </>
          )}
        </Button>

        <p
          className="mt-2 text-sm font-bold h-5 transition-all duration-300 tracking-wide uppercase"
          style={{ color: isConnected ? '#4CAF50' : 'var(--color-text-sub)' }}
        >
          {connectionStatus}
        </p>

        {/* Token Usage */}
        {isActive && isConnected && tokenUsage && (
          <TokenUsage tokenUsage={tokenUsage} className="mt-2" />
        )}
      </div>

      {/* Rate Limit Dialog */}
      {showRateLimitDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
          <div className="bg-white text-gray-900 p-8 rounded-2xl max-w-[500px] text-center shadow-lg">
            <h3 className="mb-4 text-accent-primary font-heading">Oops, this is too popular!</h3>
            <p className="mb-6 leading-relaxed">
              The global quota has been reached. But you can skip the queue by deploying your own
              version on Google Cloud Run!
            </p>
            <div className="flex flex-col gap-4 mb-6">
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
            <Button variant="primary" onClick={() => setShowRateLimitDialog(false)}>
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
