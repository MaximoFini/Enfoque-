"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { WorkType } from "@/lib/supabase/types";

export interface TimerState {
    isRunning: boolean;
    isPaused: boolean;
    isCompleted: boolean;
    timeRemaining: number; // seconds
    totalTime: number; // seconds
    workType: WorkType | null;
    startedAt: Date | null;
}

interface UseTimerReturn {
    state: TimerState;
    start: (minutes: number, type: WorkType) => void;
    pause: () => void;
    resume: () => void;
    cancel: () => void;
    complete: () => void;
    formatTime: (seconds: number) => string;
    progress: number;
}

const INITIAL_STATE: TimerState = {
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    timeRemaining: 0,
    totalTime: 0,
    workType: null,
    startedAt: null,
};

export function useTimer(): UseTimerReturn {
    const [state, setState] = useState<TimerState>(INITIAL_STATE);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio on client side
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Create a simple beep sound using Web Audio API
            audioRef.current = new Audio();
            audioRef.current.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWwySLDY1LljXqjO0s63i3s/Q5y+zrmoi3tvQXKyx8G0mphrYXaQl5JzQzk7cKS2t6+Qnk9Ra4+VoJlQPjxjk6OumYlyYl9kkKWomol0WE5JVmtvb2VRP0FBSEU2OjY9QVBQRz03OkFJR0E9OzxGTU1FPzwxLzE2Oz1APjw6ODY4NzQ0MTEyNDU1Mzc4ODc4Nzg6Ojs6Njc1Nzc1NjY3ODg5OTo5OTk5OTk4ODc3Njc2NjY3ODg4Nzk4Nzg3";
        }
    }, []);

    // Play completion sound
    const playCompletionSound = useCallback(() => {
        // Request notification permission and show notification
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification("⏱️ ¡Tiempo completado!", {
                    body: "Tu sesión de enfoque ha terminado",
                    icon: "/favicon.ico",
                });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }

        // Play audio beep
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                // Autoplay might be blocked, that's ok
            });
        }
    }, []);

    // Clear interval
    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Start timer
    const start = useCallback((minutes: number, type: WorkType) => {
        clearTimer();
        const totalSeconds = minutes * 60;

        setState({
            isRunning: true,
            isPaused: false,
            isCompleted: false,
            timeRemaining: totalSeconds,
            totalTime: totalSeconds,
            workType: type,
            startedAt: new Date(),
        });

        intervalRef.current = setInterval(() => {
            setState((prev) => {
                if (prev.timeRemaining <= 1) {
                    clearTimer();
                    playCompletionSound();
                    return {
                        ...prev,
                        isRunning: false,
                        isCompleted: true,
                        timeRemaining: 0,
                    };
                }
                return {
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1,
                };
            });
        }, 1000);
    }, [clearTimer, playCompletionSound]);

    // Pause timer
    const pause = useCallback(() => {
        clearTimer();
        setState((prev) => ({
            ...prev,
            isRunning: false,
            isPaused: true,
        }));
    }, [clearTimer]);

    // Resume timer
    const resume = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isRunning: true,
            isPaused: false,
        }));

        intervalRef.current = setInterval(() => {
            setState((prev) => {
                if (prev.timeRemaining <= 1) {
                    clearTimer();
                    playCompletionSound();
                    return {
                        ...prev,
                        isRunning: false,
                        isCompleted: true,
                        timeRemaining: 0,
                    };
                }
                return {
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1,
                };
            });
        }, 1000);
    }, [clearTimer, playCompletionSound]);

    // Cancel timer
    const cancel = useCallback(() => {
        clearTimer();
        setState(INITIAL_STATE);
    }, [clearTimer]);

    // Complete timer (after category selection)
    const complete = useCallback(() => {
        setState(INITIAL_STATE);
    }, []);

    // Format seconds to MM:SS
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, []);

    // Calculate progress percentage
    const progress = state.totalTime > 0
        ? ((state.totalTime - state.timeRemaining) / state.totalTime) * 100
        : 0;

    // Cleanup on unmount
    useEffect(() => {
        return () => clearTimer();
    }, [clearTimer]);

    return {
        state,
        start,
        pause,
        resume,
        cancel,
        complete,
        formatTime,
        progress,
    };
}
