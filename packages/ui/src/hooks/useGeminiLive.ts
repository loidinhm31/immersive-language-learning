/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { GeminiLiveAPI, FunctionCallDefinition, AudioStreamer, AudioPlayer } from '../services';
import {
  MultimodalLiveResponseType,
  type GeminiResponse,
  type TranscriptionData,
  type ToolCallData,
  type UsageMetadata,
  type CompleteMissionArgs,
} from '@immersive-lang/shared';

export interface UseGeminiLiveOptions {
  onTranscriptInput?: (text: string, finished: boolean) => void;
  onTranscriptOutput?: (text: string, finished: boolean) => void;
  onTurnComplete?: () => void;
  onMissionComplete?: (args: CompleteMissionArgs) => void;
  onError?: (error: Error) => void;
}

export interface UseGeminiLiveReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connect: (
    systemInstructions: string,
    inputTranscription: boolean,
    outputTranscription: boolean,
    sessionDuration?: number
  ) => Promise<void>;
  disconnect: () => void;
  audioContext: AudioContext | null;
  audioSource: MediaStreamAudioSourceNode | null;
  playerAudioContext: AudioContext | null;
  playerGainNode: GainNode | null;
  remainingTime: number | null;
  sessionDuration: number | null;
  tokenUsage: UsageMetadata | null;
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}): UseGeminiLiveReturn {
  const { onTranscriptInput, onTranscriptOutput, onTurnComplete, onMissionComplete, onError } =
    options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const [playerAudioContext, setPlayerAudioContext] = useState<AudioContext | null>(null);
  const [playerGainNode, setPlayerGainNode] = useState<GainNode | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [tokenUsage, setTokenUsage] = useState<UsageMetadata | null>(null);

  const clientRef = useRef<GeminiLiveAPI | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.destroy();
      }
    };
  }, []);

  const connect = useCallback(
    async (
      systemInstructions: string,
      inputTranscription: boolean,
      outputTranscription: boolean,
      sessionDuration?: number
    ) => {
      if (isConnecting || isConnected) return;

      setIsConnecting(true);

      try {
        // Initialize client
        const client = new GeminiLiveAPI();
        clientRef.current = client;

        // Initialize audio streamer and player
        const streamer = new AudioStreamer(client);
        audioStreamerRef.current = streamer;

        const player = new AudioPlayer();
        audioPlayerRef.current = player;

        // Configure client
        client.setSystemInstructions(systemInstructions);
        client.setInputAudioTranscription(inputTranscription);
        client.setOutputAudioTranscription(outputTranscription);

        // Add mission complete tool
        const completeMissionTool = new FunctionCallDefinition(
          'complete_mission',
          'Call this tool when the user has successfully completed the mission objective.',
          {
            type: 'OBJECT',
            properties: {
              score: {
                type: 'INTEGER',
                description: 'Rating from 1 to 3 based on performance',
              },
              feedback_pointers: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'List of 3 constructive feedback points',
              },
            },
          },
          ['score', 'feedback_pointers']
        );

        completeMissionTool.functionToCall = (args: Record<string, unknown>) => {
          if (onMissionComplete) {
            onMissionComplete(args as unknown as CompleteMissionArgs);
          }
        };

        client.addFunction(completeMissionTool);

        // Set up response handler
        client.onReceiveResponse = (response: GeminiResponse) => {
          if (response.type === MultimodalLiveResponseType.ERROR) {
            const errorMessage = response.data as string;
            console.error('❌ [Gemini] Error received:', errorMessage);
            // Stop audio streaming and disconnect
            audioStreamerRef.current?.stop();
            audioPlayerRef.current?.interrupt();
            // Clear timer
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setIsConnected(false);
            setRemainingTime(null);
            // Notify the error callback
            onError?.(new Error(errorMessage));
          } else if (response.type === MultimodalLiveResponseType.AUDIO) {
            audioPlayerRef.current?.play(response.data as string | ArrayBuffer);
          } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
            onTurnComplete?.();
          } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
            const toolData = response.data as ToolCallData;
            if (toolData.functionCalls) {
              toolData.functionCalls.forEach(fc => {
                client.callFunction(fc.name, fc.args as Record<string, unknown>);
              });
            }
          } else if (response.type === MultimodalLiveResponseType.INPUT_TRANSCRIPTION) {
            const data = response.data as TranscriptionData;
            onTranscriptInput?.(data.text, data.finished);
          } else if (response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
            const data = response.data as TranscriptionData;
            onTranscriptOutput?.(data.text, data.finished);
          } else if (response.type === MultimodalLiveResponseType.USAGE_METADATA) {
            const usage = response.data as UsageMetadata;
            setTokenUsage(prev => {
              if (!prev) return usage;
              // Accumulate token counts across messages
              return {
                promptTokenCount: prev.promptTokenCount + usage.promptTokenCount,
                candidatesTokenCount: prev.candidatesTokenCount + usage.candidatesTokenCount,
                totalTokenCount: prev.totalTokenCount + usage.totalTokenCount,
              };
            });
          }
        };

        client.onConnectionStarted = () => {
          console.log('🚀 [Gemini] Connection started');
        };

        client.onClose = () => {
          console.log('🔒 [Gemini] Connection closed');
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setIsConnected(false);
          setRemainingTime(null);
        };

        client.onError = () => {
          setIsConnected(false);
        };

        // Connect (no ReCAPTCHA token needed for dev mode)
        await client.connect(null, sessionDuration);

        // Start audio streaming
        await streamer.start();

        // Set audio contexts for visualizers
        if (streamer.audioContext && streamer.source) {
          setAudioContext(streamer.audioContext);
          setAudioSource(streamer.source);
        }

        // Initialize audio player
        await player.init();

        if (player.audioContext && player.gainNode) {
          setPlayerAudioContext(player.audioContext);
          setPlayerGainNode(player.gainNode);
        }

        setIsConnected(true);

        // Start session timer countdown
        if (sessionDuration) {
          setSessionDuration(sessionDuration);
          setRemainingTime(sessionDuration);
          const startTime = Date.now();
          timerIntervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, sessionDuration - elapsed);
            setRemainingTime(remaining);
            if (remaining === 0) {
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to connect:', error);
        onError?.(error as Error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [
      isConnecting,
      isConnected,
      onTranscriptInput,
      onTranscriptOutput,
      onTurnComplete,
      onMissionComplete,
      onError,
    ]
  );

  const disconnect = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.interrupt();
    }

    setIsConnected(false);
    setAudioContext(null);
    setAudioSource(null);
    setPlayerAudioContext(null);
    setPlayerGainNode(null);
    setRemainingTime(null);
    setSessionDuration(null);
    setTokenUsage(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    audioContext,
    audioSource,
    playerAudioContext,
    playerGainNode,
    remainingTime,
    sessionDuration,
    tokenUsage,
  };
}
