/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@immersive-lang/shared';

export interface AudioVisualizerProps {
  audioContext?: AudioContext | null;
  sourceNode?: AudioNode | null;
  className?: string;
  color?: string;
  role?: 'user' | 'ai';
  label?: string;
  glowOnActivity?: boolean;
}

const ROLE_COLORS = {
  user: '#2dd4bf', // teal
  ai: '#f59e0b',   // amber/warm
};

const VAD_THRESHOLD = 0.02; // RMS energy threshold for voice activity
const GLOW_LERP_FACTOR = 0.15; // Smoothing factor for glow transitions

export function AudioVisualizer({
  audioContext,
  sourceNode,
  className,
  color,
  role,
  label,
  glowOnActivity = true,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const pointsRef = useRef<number[]>([]);
  const isActiveRef = useRef(false);
  const glowIntensityRef = useRef(0); // Current glow intensity (0-1)
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const lineColor = role ? ROLE_COLORS[role] : color;

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }, [color, role]);

  const animate = useCallback(() => {
    if (!isActiveRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animationIdRef.current = requestAnimationFrame(animate);

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Voice Activity Detection: Compute RMS energy
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128.0;
      rms += normalized * normalized;
    }
    rms = Math.sqrt(rms / dataArray.length);

    // Determine if voice is active
    const isActive = glowOnActivity && rms > VAD_THRESHOLD;

    // Smooth glow intensity transition using LERP
    const targetGlow = isActive ? 1.0 : 0.0;
    glowIntensityRef.current += (targetGlow - glowIntensityRef.current) * GLOW_LERP_FACTOR;

    // Update voice active state for label display
    setIsVoiceActive(glowIntensityRef.current > 0.1);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Determine color based on role or prop
    const lineColor = role ? ROLE_COLORS[role] : color;

    // Apply glow effect when active
    if (glowIntensityRef.current > 0.01) {
      ctx.shadowBlur = 15 * glowIntensityRef.current;
      ctx.shadowColor = lineColor;
      ctx.lineWidth = 3 + glowIntensityRef.current * 2; // Increase line width when active
      ctx.globalAlpha = 0.8 + 0.2 * glowIntensityRef.current;
    } else {
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
    }

    ctx.strokeStyle = lineColor;
    ctx.beginPath();

    // Configuration for "Guitar String" effect
    const pointsCount = 20;
    const lerpFactor = 0.3;
    const amplitudeScale = 10.0;

    // Initialize points array if needed
    if (pointsRef.current.length !== pointsCount) {
      pointsRef.current = new Array(pointsCount).fill(0);
    }

    const sliceWidth = width / (pointsCount - 1);
    const bufferStep = Math.floor(dataArray.length / pointsCount);

    for (let i = 0; i < pointsCount; i++) {
      const audioIndex = Math.min(i * bufferStep, dataArray.length - 1);
      let val = dataArray[audioIndex] / 128.0 - 1.0;

      // Guitar string windowing
      const normalization = i / (pointsCount - 1);
      const window = Math.sin(normalization * Math.PI);
      const targetY = val * (height * 0.4) * amplitudeScale * window;

      // LERP smoothing
      pointsRef.current[i] += (targetY - pointsRef.current[i]) * lerpFactor;
    }

    // Draw the curve
    for (let i = 0; i < pointsCount; i++) {
      const x = i * sliceWidth;
      const y = height / 2 + pointsRef.current[i];

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * sliceWidth;
        const prevY = height / 2 + pointsRef.current[i - 1];
        const cx = (prevX + x) / 2;
        const cy = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cx, cy);
      }
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Reset shadow and alpha for next frame
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }, [color, role, glowOnActivity]);

  // Connect audio source
  useEffect(() => {
    if (!audioContext || !sourceNode) {
      isActiveRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      drawIdle();
      return;
    }

    try {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      isActiveRef.current = true;
      animate();

      return () => {
        isActiveRef.current = false;
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        try {
          sourceNode.disconnect(analyser);
        } catch {
          // Ignore disconnect errors
        }
        analyserRef.current = null;
        drawIdle();
      };
    } catch (err) {
      console.error('Error connecting visualizer:', err);
    }
  }, [audioContext, sourceNode, animate, drawIdle]);

  // Handle resize
  useEffect(() => {
    resize();

    const resizeObserver = new ResizeObserver(resize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current.parentElement || canvasRef.current);
    }

    window.addEventListener('resize', resize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [resize]);

  // Initial draw
  useEffect(() => {
    if (!isActiveRef.current) {
      drawIdle();
    }
  }, [drawIdle]);

  // Determine label color and status text based on role
  const labelColor = role ? ROLE_COLORS[role] : color;
  const statusText = role === 'user' ? 'Listening...' : role === 'ai' ? 'Speaking...' : '';

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {/* Label and Status */}
      {label && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span
            className="text-sm font-bold transition-opacity duration-300"
            style={{
              color: labelColor,
              opacity: isVoiceActive ? 1.0 : 0.5,
            }}
          >
            {label}
          </span>
          {statusText && (
            <span
              className="text-xs italic transition-opacity duration-300"
              style={{
                color: labelColor,
                opacity: isVoiceActive ? 0.8 : 0,
              }}
            >
              {statusText}
            </span>
          )}
        </div>
      )}

      {/* Waveform Canvas */}
      <div className="flex-1 w-full">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
}
