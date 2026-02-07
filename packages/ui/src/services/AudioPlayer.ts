/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { AUDIO_SAMPLE_RATES } from '@immersive-lang/shared';

/**
 * Audio Player - Plays audio responses from Gemini
 */
export class AudioPlayer {
  audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  gainNode: GainNode | null = null;
  private isInitialized: boolean = false;
  private volume: number = 1.0;
  private sampleRate: number = AUDIO_SAMPLE_RATES.OUTPUT;

  workletUrl: string = '/audio-processors/playback.worklet.js';

  constructor(workletUrl?: string) {
    if (workletUrl) {
      this.workletUrl = workletUrl;
    }
  }

  /**
   * Initialize the audio player
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context at 24kHz to match Gemini
      this.audioContext = new AudioContext({
        sampleRate: this.sampleRate,
      });

      // Load the audio worklet from external file
      if (!this.audioContext.audioWorklet) {
        throw new Error(
          'AudioWorklet is not supported. Please use a secure context (HTTPS/localhost) or a modern browser.'
        );
      }
      await this.audioContext.audioWorklet.addModule(this.workletUrl);

      // Create worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;

      // Connect nodes
      this.workletNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isInitialized = true;
      console.log('🔊 Audio player initialized');
    } catch (error) {
      console.error('Failed to initialize audio player:', error);
      throw error;
    }
  }

  /**
   * Play audio chunk from base64 PCM or ArrayBuffer
   */
  async play(audioData: string | ArrayBuffer): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      let bytes: Uint8Array;

      if (audioData instanceof ArrayBuffer) {
        bytes = new Uint8Array(audioData);
      } else if (typeof audioData === 'string') {
        // Convert base64 to Uint8Array
        const binaryString = atob(audioData);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
      } else {
        console.error('Unknown audio data format:', audioData);
        return;
      }

      // Convert PCM16 LE to Float32
      const inputArray = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(inputArray.length);
      for (let i = 0; i < inputArray.length; i++) {
        float32Data[i] = inputArray[i] / 32768;
      }

      // Send to worklet for playback
      this.workletNode?.port.postMessage(float32Data);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      throw error;
    }
  }

  /**
   * Interrupt current playback
   */
  interrupt(): void {
    if (this.workletNode) {
      this.workletNode.port.postMessage('interrupt');
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.workletNode = null;
    this.gainNode = null;
    this.isInitialized = false;
  }
}
