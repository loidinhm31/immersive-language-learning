/**
 * Copyright 2026 Google LLC
 * Licensed under the Apache License, Version 2.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TextCycler } from '../molecules';
import { Button } from '../atoms';

const START_TRANSLATIONS = [
  'ابدأ',
  'Comenzar',
  'Commencer',
  'شروع کرें',
  'Mulai',
  'Inizia',
  'スタート',
  '시작',
  'Começar',
  'Начать',
  'เริ่ม',
  'Başla',
  'Bắt đầu',
  'Почати',
  'শুরু',
  'साुरु करा',
  'தொடங்கு',
  'ప్రారంభించు',
];

const ALPHABETS = [
  'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
  'अआइईउऊऋएऐओऔकखगघङचछजझञ',
  'あいうえおかがきぎくぐけげこご',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'אתבגדהוזחטיכלמנסעפצקרשת',
  '가나다라마바사아자차카타파하',
];

export interface SplashPageProps {
  onStart: () => void;
}

export function SplashPage({ onStart }: SplashPageProps) {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = particlesRef.current;
    if (!host) return;

    const particleCount = 30;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'splash-particle';
      const alphabet = ALPHABETS[Math.floor(Math.random() * ALPHABETS.length)];
      p.textContent = alphabet[Math.floor(Math.random() * alphabet.length)];
      p.style.cssText = `
        position: absolute;
        font-family: 'JetBrains Mono', monospace;
        pointer-events: none;
        opacity: 0;
        animation: floatUp ${10 + Math.random() * 10}s linear infinite;
        animation-delay: ${Math.random() * 15}s;
        color: var(--color-accent-primary);
        font-size: ${0.8 + Math.random() * 1.5}rem;
        z-index: 0;
        filter: blur(1px);
        left: ${Math.random() * 100}%;
      `;
      host.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  const handleStart = useCallback(() => {
    onStart();
  }, [onStart]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* CSS for particles animation */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(110vh) translateX(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.3; transform: translateY(80vh) translateX(30px) rotate(45deg); }
          50% { transform: translateY(50vh) translateX(-30px) rotate(90deg); }
          80% { opacity: 0.3; transform: translateY(20vh) translateX(30px) rotate(135deg); }
          100% { transform: translateY(-20vh) translateX(0) rotate(180deg); opacity: 0; }
        }
      `}</style>

      {/* Particles container */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[1200px] min-h-[90vh] flex flex-col justify-center items-center mx-auto px-8 pt-[10vh] pb-[15vh]">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-extrabold tracking-tight leading-normal mb-2 px-4 pb-[0.3em] text-center"
          style={{
            background:
              'linear-gradient(135deg, var(--color-text-main) 30%, var(--color-accent-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(163, 177, 138, 0.2))',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
          }}
        >
          Immersive Language Learning
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-serif italic text-center max-w-[600px] mb-8 text-text-sub"
          style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)' }}
        >
          Intense immersive language learning experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-6 text-center leading-relaxed"
          style={{ fontSize: '1.3rem' }}
        >
          <p className="text-text-sub">
            Powered by <br />
            <a
              href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary font-bold border-b-2 border-transparent hover:border-accent-primary transition-all"
            >
              Gemini Live API on Vertex AI
            </a>
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-24 w-full flex justify-center"
        >
          <Button size="xl" onClick={handleStart} className="relative overflow-hidden">
            <TextCycler text="Start" values={START_TRANSLATIONS} />
          </Button>
        </motion.div>
      </div>

      {/* Disclaimer Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-xs opacity-50 max-w-[600px] mx-auto leading-relaxed text-center px-4 z-10">
        <strong>Disclaimer:</strong> This application is for demo purposes only. This is not an
        official product. May produce inaccurate, unexpected, or offensive results. Present to a
        live audience at your own risk.
      </div>
    </div>
  );
}
