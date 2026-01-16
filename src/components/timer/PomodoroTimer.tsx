"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

interface PomodoroTimerProps {
    onComplete: (minutes: number) => void;
}

type TimerMode = "pomodoro" | "break";

export function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
    const [mode, setMode] = React.useState<TimerMode>("pomodoro");
    const [pomodoroMinutes, setPomodoroMinutes] = React.useState(25);
    const [breakMinutes, setBreakMinutes] = React.useState(5);
    const [timeLeft, setTimeLeft] = React.useState(pomodoroMinutes * 60);
    const [isRunning, setIsRunning] = React.useState(false);
    const [accumulatedTime, setAccumulatedTime] = React.useState(0); // in seconds
    const [sessionStartTime, setSessionStartTime] = React.useState<number | null>(null);

    // Update timeLeft when settings change
    React.useEffect(() => {
        if (!isRunning) {
            setTimeLeft(mode === "pomodoro" ? pomodoroMinutes * 60 : breakMinutes * 60);
        }
    }, [pomodoroMinutes, breakMinutes, mode, isRunning]);

    // Timer countdown
    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Timer completed - AUTOPLAY
            if (mode === "pomodoro" && sessionStartTime) {
                // Add completed pomodoro time
                const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
                setAccumulatedTime(prev => prev + elapsedSeconds);

                // Play sound
                playNotification();

                // Switch to break - keep running (autoplay)
                setMode("break");
                setTimeLeft(breakMinutes * 60);
                setSessionStartTime(null);
                // Keep isRunning = true for autoplay
            } else if (mode === "break") {
                // Break completed, start next pomodoro automatically
                playNotification();
                setMode("pomodoro");
                setTimeLeft(pomodoroMinutes * 60);
                setSessionStartTime(Date.now());
                // Keep isRunning = true for autoplay
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft, mode, pomodoroMinutes, breakMinutes, sessionStartTime]);

    const playNotification = () => {
        try {
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {
                // If no audio file, use browser notification
                if (Notification.permission === "granted") {
                    new Notification("🍅 Pomodoro", {
                        body: mode === "pomodoro" ? "¡Tiempo de descanso!" : "¡A trabajar!",
                    });
                }
            });
        } catch {
            // Fallback
        }
    };

    const toggleTimer = () => {
        if (!isRunning && mode === "pomodoro") {
            setSessionStartTime(Date.now());
        }
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setSessionStartTime(null);
        setTimeLeft(mode === "pomodoro" ? pomodoroMinutes * 60 : breakMinutes * 60);
    };

    const stopAndSave = () => {
        if (mode === "pomodoro" && sessionStartTime) {
            const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            const totalSeconds = accumulatedTime + elapsedSeconds;
            const totalMinutes = Math.floor(totalSeconds / 60);

            if (totalMinutes > 0) {
                onComplete(totalMinutes);
            }

            setAccumulatedTime(0);
        }

        setIsRunning(false);
        setSessionStartTime(null);
        setTimeLeft(pomodoroMinutes * 60);
        setMode("pomodoro");
    };

    const switchMode = (newMode: TimerMode) => {
        if (!isRunning) {
            setMode(newMode);
            setTimeLeft(newMode === "pomodoro" ? pomodoroMinutes * 60 : breakMinutes * 60);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const totalAccumulatedMinutes = Math.floor(
        (accumulatedTime + (isRunning && mode === "pomodoro" && sessionStartTime
            ? (Date.now() - sessionStartTime) / 1000
            : 0)) / 60
    );

    return (
        <div className={`rounded-2xl p-8 transition-colors ${mode === "pomodoro"
            ? "bg-gradient-to-br from-red-600 to-red-700"
            : "bg-gradient-to-br from-green-600 to-green-700"
            }`}>
            {/* Mode selector */}
            <div className="flex justify-center gap-2 mb-8">
                <button
                    onClick={() => switchMode("pomodoro")}
                    disabled={isRunning}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${mode === "pomodoro"
                        ? "bg-white/20 text-white"
                        : "bg-transparent text-white/60 hover:text-white hover:bg-white/10"
                        } ${isRunning ? "cursor-not-allowed" : ""}`}
                >
                    🍅 Pomodoro
                </button>
                <button
                    onClick={() => switchMode("break")}
                    disabled={isRunning}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${mode === "break"
                        ? "bg-white/20 text-white"
                        : "bg-transparent text-white/60 hover:text-white hover:bg-white/10"
                        } ${isRunning ? "cursor-not-allowed" : ""}`}
                >
                    <Coffee className="h-4 w-4" />
                    Descanso
                </button>
            </div>

            {/* Timer display */}
            <div className="text-center mb-8">
                <p className="text-[8rem] font-bold text-white leading-none tracking-tight">
                    {formatTime(timeLeft)}
                </p>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={toggleTimer}
                    className="px-12 py-4 rounded-xl bg-black/30 hover:bg-black/40 text-white font-bold text-lg transition-colors flex items-center gap-2"
                >
                    {isRunning ? (
                        <>
                            <Pause className="h-6 w-6" />
                            PAUSAR
                        </>
                    ) : (
                        <>
                            <Play className="h-6 w-6" />
                            INICIAR
                        </>
                    )}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Reiniciar"
                >
                    <RotateCcw className="h-6 w-6" />
                </button>
            </div>

            {/* Settings */}
            {!isRunning && (
                <div className="flex justify-center gap-8 mb-6">
                    <div className="text-center">
                        <label className="text-white/70 text-sm block mb-2">Pomodoro</label>
                        <select
                            value={pomodoroMinutes}
                            onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white border-none text-center font-bold"
                        >
                            {[15, 20, 25, 30, 45, 60, 90].map(m => (
                                <option key={m} value={m} className="bg-gray-800">{m} min</option>
                            ))}
                        </select>
                    </div>
                    <div className="text-center">
                        <label className="text-white/70 text-sm block mb-2">Descanso</label>
                        <select
                            value={breakMinutes}
                            onChange={(e) => setBreakMinutes(Number(e.target.value))}
                            className="px-4 py-2 rounded-lg bg-white/10 text-white border-none text-center font-bold"
                        >
                            {[5, 10, 15, 20].map(m => (
                                <option key={m} value={m} className="bg-gray-800">{m} min</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Accumulated time */}
            {(accumulatedTime > 0 || (isRunning && mode === "pomodoro")) && (
                <div className="text-center border-t border-white/20 pt-6">
                    <p className="text-white/70 text-sm mb-1">Tiempo efectivo acumulado</p>
                    <p className="text-2xl font-bold text-white">
                        {totalAccumulatedMinutes} minutos
                    </p>
                    <button
                        onClick={stopAndSave}
                        className="mt-4 px-6 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                    >
                        Guardar y reiniciar
                    </button>
                </div>
            )}
        </div>
    );
}
