"use client";

import * as React from "react";
import { Play, Pause, X, RotateCcw, Brain, Zap } from "lucide-react";
import { useTimer } from "@/hooks/useTimer";
import type { WorkType } from "@/lib/supabase/types";
import { createTimeLog, getCurrentUserId } from "@/lib/supabase/services";
import { CategoryModal } from "./CategoryModal";

interface TimerDisplayProps {
    onLogSaved?: () => void;
}

export function TimerDisplay({ onLogSaved }: TimerDisplayProps) {
    const { state, start, pause, resume, cancel, complete, formatTime, progress } = useTimer();
    const [showCategoryModal, setShowCategoryModal] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    // Show category modal when timer completes
    React.useEffect(() => {
        if (state.isCompleted) {
            setShowCategoryModal(true);
        }
    }, [state.isCompleted]);

    const handleStartDeepWork = () => {
        start(90, "deep");
    };

    const handleStartShallowWork = () => {
        start(25, "shallow");
    };

    const handleCategorySave = async (categoryId: string, subcategoryId?: string) => {
        setIsSaving(true);

        try {
            const userId = await getCurrentUserId();

            if (userId && state.startedAt) {
                await createTimeLog({
                    userId,
                    categoryId,
                    subcategoryId,
                    durationMinutes: Math.round(state.totalTime / 60),
                    workType: state.workType || "deep",
                    startedAt: state.startedAt,
                    endedAt: new Date(),
                });
            }

            setShowCategoryModal(false);
            complete();
            onLogSaved?.();
        } catch (error) {
            console.error("Error saving time log:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCategoryClose = () => {
        setShowCategoryModal(false);
        complete();
    };

    // Idle state - show start buttons
    if (!state.isRunning && !state.isPaused && !state.isCompleted) {
        return (
            <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white">
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">¿Listo para enfocarte?</h2>
                        <p className="text-white/70">Elige tu modo de trabajo</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {/* Deep Work Button */}
                        <button
                            onClick={handleStartDeepWork}
                            className="group relative overflow-hidden rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Brain className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold">Deep Work</p>
                                    <p className="text-white/70 text-sm">90 minutos</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        {/* Shallow Work Button */}
                        <button
                            onClick={handleStartShallowWork}
                            className="group relative overflow-hidden rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Zap className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold">Shallow Work</p>
                                    <p className="text-white/70 text-sm">25 minutos</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Running or paused state
    return (
        <>
            <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-20">
                    <div
                        className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/20 blur-3xl transition-all duration-1000 ${state.isRunning ? "animate-pulse" : ""
                            }`}
                    />
                    <div
                        className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl transition-all duration-1000 ${state.isRunning ? "animate-pulse" : ""
                            }`}
                    />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Work type badge */}
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                        {state.workType === "deep" ? (
                            <Brain className="h-4 w-4" />
                        ) : (
                            <Zap className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                            {state.workType === "deep" ? "Deep Work" : "Shallow Work"}
                        </span>
                    </div>

                    {/* Circular progress */}
                    <div className="relative w-48 h-48 mb-8">
                        {/* Background circle */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="96"
                                cy="96"
                                r="88"
                                fill="none"
                                stroke="rgba(255,255,255,0.9)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 88}`}
                                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>

                        {/* Time display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-5xl font-bold tabular-nums ${state.isRunning ? "animate-pulse" : ""}`}>
                                {formatTime(state.timeRemaining)}
                            </span>
                            {state.isPaused && (
                                <span className="text-sm text-white/70 mt-1">Pausado</span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {state.isPaused ? (
                            <button
                                onClick={resume}
                                className="w-14 h-14 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                aria-label="Continuar"
                            >
                                <Play className="h-6 w-6 ml-1" />
                            </button>
                        ) : (
                            <button
                                onClick={pause}
                                className="w-14 h-14 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                aria-label="Pausar"
                            >
                                <Pause className="h-6 w-6" />
                            </button>
                        )}

                        <button
                            onClick={cancel}
                            className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-red-500/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            aria-label="Cancelar"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category selection modal */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={handleCategoryClose}
                onSave={handleCategorySave}
                workType={state.workType || "deep"}
                duration={state.totalTime / 60}
            />
        </>
    );
}
