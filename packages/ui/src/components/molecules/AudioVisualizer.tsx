import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@immersive-lang/shared";

export interface AudioVisualizerProps {
    audioContext?: AudioContext | null;
    sourceNode?: AudioNode | null;
    className?: string;
    color?: string;
    role?: "user" | "ai";
    label?: string;
    glowOnActivity?: boolean;
    mode?: "classic" | "modern";
}

const ROLE_COLORS = {
    user: "#2dd4bf", // teal-400
    ai: "#fbbf24", // amber-400
};

const ROLE_GRADIENTS = {
    user: ["rgba(45, 212, 191, 0)", "#2dd4bf", "rgba(45, 212, 191, 0)"],
    ai: ["rgba(251, 191, 36, 0)", "#fbbf24", "rgba(251, 191, 36, 0)"],
};

const VAD_THRESHOLD = 0.01; // Lower threshold slightly for better reactivity
const GLOW_LERP_FACTOR = 0.1; // Smoother glow

export function AudioVisualizer({
    audioContext,
    sourceNode,
    className,
    color,
    role,
    label,
    glowOnActivity = true,
    mode = "modern",
}: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const isActiveRef = useRef(false);
    const glowIntensityRef = useRef(0);
    const timeRef = useRef(0);
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const resize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Use device pixel ratio for sharper rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
    }, []);

    const drawIdle = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // We need to clear based on the scaled dimensions
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);

        const lineColor = role ? ROLE_COLORS[role] : color || "#ffffff";

        // Simple flat line for idle state
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }, [color, role]);

    const animate = useCallback(() => {
        if (!isActiveRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        animationIdRef.current = requestAnimationFrame(animate);

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        // We use a smaller array for RMS calculation to avoid iterating too much
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        // RMS Calculation
        let rms = 0;
        for (let i = 0; i < dataArray.length; i++) {
            // Convert 0..255 to -1..1
            const v = (dataArray[i] - 128) / 128.0;
            rms += v * v;
        }
        rms = Math.sqrt(rms / dataArray.length);

        // Activity Detection & Glow
        const isActive = glowOnActivity && rms > VAD_THRESHOLD;
        const targetGlow = isActive ? Math.min(rms * 5.0, 1.0) : 0; // Scale RMS for glow
        glowIntensityRef.current += (targetGlow - glowIntensityRef.current) * GLOW_LERP_FACTOR;

        // Update React state for label
        // Use a slightly different threshold for the label so it doesn't flicker too much
        if (glowIntensityRef.current > 0.05 && !isVoiceActive) setIsVoiceActive(true);
        else if (glowIntensityRef.current < 0.02 && isVoiceActive) setIsVoiceActive(false);

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        // Setup base styles
        const lineColor = role ? ROLE_COLORS[role] : color || "#ffffff";
        const gradientColors = role ? ROLE_GRADIENTS[role] : ["transparent", lineColor, "transparent"];

        // Create Gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(0.5, gradientColors[1]);
        gradient.addColorStop(1, gradientColors[2]);

        // Apply Glow
        const glowAmount = glowIntensityRef.current;
        if (glowAmount > 0.01) {
            ctx.shadowBlur = 15 * glowAmount;
            ctx.shadowColor = lineColor;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.lineWidth = 2 + glowAmount * 2;
        ctx.strokeStyle = gradient;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        timeRef.current += 0.05; // Animation speed

        // Multi-Wave Rendering
        const drawWave = (amplitude: number, frequency: number, phase: number, opacity: number) => {
            ctx.beginPath();
            ctx.globalAlpha = opacity;

            // Base amplitude modulated by audio loudness (RMS) + a minimum "breathing" amount
            // Increased breathing amplitude for better visibility
            const currentAmp = height * 0.4 * (rms * 4.0 * amplitude) + height * 0.05 * amplitude;

            for (let x = 0; x <= width; x += 5) {
                // Normalized X (-1 to 1) for windowing
                const nx = (x / width) * 2 - 1;
                // Window function (Hanning-ish) to taper ends
                const window = 1 - Math.pow(nx, 2);

                // Sine wave function
                const y = height / 2 + Math.sin(x * frequency * 0.01 + timeRef.current + phase) * currentAmp * window;

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        // Draw 3 overlapping waves with slight variations
        // Main wave
        drawWave(1.0, 1.0, 0, 1.0);
        // Secondary wave (slower, lower amplitude)
        drawWave(0.8, 0.7, 2, 0.5);
        // Tertiary wave (faster, different phase)
        drawWave(0.5, 1.5, 4, 0.3);

        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }, [color, role, glowOnActivity, isVoiceActive]); // Added isVoiceActive dependency to avoid stale closure issues if refs weren't enough (though refs are fine here)

    // Connect Audio
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
            // Re-use existing analyser if possible, or create new one
            if (!analyserRef.current) {
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                sourceNode.connect(analyser);
                analyserRef.current = analyser;
            }

            isActiveRef.current = true;
            animate();

            return () => {
                isActiveRef.current = false;
                if (animationIdRef.current) {
                    cancelAnimationFrame(animationIdRef.current);
                    animationIdRef.current = null;
                }
                // Don't disconnect here to avoid breaking the audio graph if the parent component re-renders
                // Just stop animating.
                drawIdle();
            };
        } catch (err) {
            console.error("Error connecting visualizer:", err);
        }
    }, [audioContext, sourceNode, animate, drawIdle]);

    // Handle Resize
    useEffect(() => {
        resize();
        const observer = new ResizeObserver(resize);
        if (canvasRef.current) {
            observer.observe(canvasRef.current.parentElement || canvasRef.current);
        }
        window.addEventListener("resize", resize);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", resize);
        };
    }, [resize]);

    // Initial Draw
    useEffect(() => {
        if (!isActiveRef.current) drawIdle();
    }, [drawIdle]);

    // Label Logic
    const labelColor = role ? ROLE_COLORS[role] : color;
    const statusText = role === "user" ? "Listening..." : role === "ai" ? "Speaking..." : "";

    return (
        <div className={cn("w-full h-full flex flex-col", className)}>
            {label && (
                <div className="flex items-center justify-center gap-2 mb-2 min-h-6">
                    {" "}
                    {/* Added min-height to prevent jumping */}
                    <span
                        className="text-sm font-bold transition-opacity duration-300 uppercase tracking-wider"
                        style={{
                            color: labelColor,
                            opacity: isVoiceActive || isActiveRef.current ? 1.0 : 0.6,
                        }}
                    >
                        {label}
                    </span>
                    {statusText && (
                        <span
                            className="text-xs transition-opacity duration-300"
                            style={{
                                color: labelColor,
                                opacity: isVoiceActive ? 0.9 : 0,
                            }}
                        >
                            {statusText}
                        </span>
                    )}
                </div>
            )}

            <div className="flex-1 w-full relative">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
        </div>
    );
}
