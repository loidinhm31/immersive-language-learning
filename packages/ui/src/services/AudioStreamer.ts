/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { AUDIO_SAMPLE_RATES } from '@immersive-lang/shared';
import type { GeminiLiveAPI } from './GeminiLiveAPI';

/**
 * Audio Streamer - Captures and streams microphone audio to Gemini
 */
export class AudioStreamer {
  private client: GeminiLiveAPI;
  audioContext: AudioContext | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isStreaming: boolean = false;
  private sampleRate: number = AUDIO_SAMPLE_RATES.INPUT;
  source: MediaStreamAudioSourceNode | null = null;

  workletUrl: string;

  constructor(geminiClient: GeminiLiveAPI, workletUrl: string = '/audio-processors/capture.worklet.js') {
    this.client = geminiClient;
    this.workletUrl = workletUrl;
  }

  /**
   * Start streaming audio from microphone
   */
  async start(deviceId: string | null = null): Promise<boolean> {
    try {
      // Build audio constraints
      const audioConstraints: MediaTrackConstraints = {
        sampleRate: this.sampleRate,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      // Add device ID if specified
      if (deviceId) {
        audioConstraints.deviceId = { exact: deviceId };
      }

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      // Create audio context at 16kHz
      this.audioContext = new AudioContext({
        sampleRate: this.sampleRate,
      });

      // Load the audio worklet module
      try {
        await this.audioContext.audioWorklet.addModule(this.workletUrl);
      } catch (e) {
        // Fallback or detailed error logging
        console.error(`Failed to load audio worklet from ${this.workletUrl}. Treating as fatal.`, e);
        throw e;
      }

      // Create the audio worklet node
      this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-capture-processor');

      // Set up message handling from the worklet
      this.audioWorklet.port.onmessage = (event: MessageEvent) => {
        if (!this.isStreaming) return;

        if (event.data.type === 'audio') {
          const inputData = event.data.data as Float32Array;
          const pcmData = this.convertToPCM16(inputData);

          // Send to Gemini
          if (this.client && this.client.connected) {
            this.client.sendAudioMessage(pcmData);
          }
        }
      };

      // Connect the audio graph
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.audioWorklet);

      this.isStreaming = true;
      console.log('🎤 Audio streaming started');
      return true;
    } catch (error) {
      console.error('Failed to start audio streaming:', error);
      throw error;
    }
  }

  /**
   * Stop audio streaming
   */
  stop(): void {
    this.isStreaming = false;

    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet.port.close();
      this.audioWorklet = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.source = null;
    console.log('🛑 Audio streaming stopped');
  }

  /**
   * Convert Float32Array to PCM16 Int16Array
   */
  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample * 0x7fff;
    }
    return int16Array.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
