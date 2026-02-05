/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@immersive-lang/shared';

export interface AudioVisualizerProps {
  audioContext?: AudioContext | null;
  sourceNode?: AudioNode | null;
  className?: string;
  color?: string;
}

export function AudioVisualizer({
  audioContext,
  sourceNode,
  className,
  color = '#5c6b48',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const pointsRef = useRef<number[]>([]);
  const isActiveRef = useRef(false);

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

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }, [color]);

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

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
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
  }, [color]);

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

  return (
    <div className={cn('w-full h-full', className)}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
