import { useState, useCallback, useRef, useEffect } from "react";
import { AUDIO_SAMPLE_RATES } from "@immersive-lang/shared";

export interface UseAudioStreamReturn {
    isStreaming: boolean;
    audioContext: AudioContext | null;
    source: MediaStreamAudioSourceNode | null;
    analyser: AnalyserNode | null;
    start: (deviceId?: string) => Promise<void>;
    stop: () => void;
}

export function useAudioStream(): UseAudioStreamReturn {
    const [isStreaming, setIsStreaming] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioContext) {
                audioContext.close();
            }
        };
    }, [audioContext]);

    const start = useCallback(async (deviceId?: string) => {
        try {
            const constraints: MediaTrackConstraints = {
                sampleRate: AUDIO_SAMPLE_RATES.INPUT,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            };

            if (deviceId) {
                constraints.deviceId = { exact: deviceId };
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: constraints,
            });
            mediaStreamRef.current = stream;

            const ctx = new AudioContext({
                sampleRate: AUDIO_SAMPLE_RATES.INPUT,
            });
            setAudioContext(ctx);

            const sourceNode = ctx.createMediaStreamSource(stream);
            setSource(sourceNode);

            const analyserNode = ctx.createAnalyser();
            analyserNode.fftSize = 2048;
            sourceNode.connect(analyserNode);
            setAnalyser(analyserNode);

            setIsStreaming(true);
        } catch (error) {
            console.error("Failed to start audio stream:", error);
            throw error;
        }
    }, []);

    const stop = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }

        if (audioContext) {
            audioContext.close();
            setAudioContext(null);
        }

        setSource(null);
        setAnalyser(null);
        setIsStreaming(false);
    }, [audioContext]);

    return {
        isStreaming,
        audioContext,
        source,
        analyser,
        start,
        stop,
    };
}
