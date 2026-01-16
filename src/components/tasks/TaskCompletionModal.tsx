"use client";

import * as React from "react";
import { X, Clock, Check, SkipForward } from "lucide-react";

interface TaskCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (actualMinutes?: number) => void;
    taskTitle: string;
    estimatedMinutes?: number;
}

export function TaskCompletionModal({
    isOpen,
    onClose,
    onConfirm,
    taskTitle,
    estimatedMinutes,
}: TaskCompletionModalProps) {
    const [hours, setHours] = React.useState(0);
    const [minutes, setMinutes] = React.useState(estimatedMinutes || 30);

    React.useEffect(() => {
        if (estimatedMinutes) {
            setHours(Math.floor(estimatedMinutes / 60));
            setMinutes(estimatedMinutes % 60);
        }
    }, [estimatedMinutes]);

    const handleConfirm = () => {
        const totalMinutes = hours * 60 + minutes;
        onConfirm(totalMinutes > 0 ? totalMinutes : undefined);
    };

    const handleSkip = () => {
        onConfirm(undefined);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">¡Tarea completada!</h2>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {taskTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    <div className="text-center">
                        <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-foreground font-medium">
                            ¿Cuánto tiempo te tomó?
                        </p>
                        {estimatedMinutes && (
                            <p className="text-sm text-muted-foreground">
                                Estimado: {Math.floor(estimatedMinutes / 60) > 0 ? `${Math.floor(estimatedMinutes / 60)}h ` : ''}
                                {estimatedMinutes % 60}m
                            </p>
                        )}
                    </div>

                    {/* Time input */}
                    <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                            <input
                                type="number"
                                min="0"
                                max="23"
                                value={hours}
                                onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                className="w-16 h-14 px-2 rounded-xl bg-secondary text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">horas</p>
                        </div>
                        <span className="text-2xl font-bold text-muted-foreground">:</span>
                        <div className="text-center">
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={minutes}
                                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                className="w-16 h-14 px-2 rounded-xl bg-secondary text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground mt-1">minutos</p>
                        </div>
                    </div>

                    {/* Quick options */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[15, 30, 45, 60, 90, 120].map((mins) => (
                            <button
                                key={mins}
                                onClick={() => {
                                    setHours(Math.floor(mins / 60));
                                    setMinutes(mins % 60);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hours * 60 + minutes === mins
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary hover:bg-accent text-foreground'
                                    }`}
                            >
                                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 pt-0 flex gap-3">
                    <button
                        onClick={handleSkip}
                        className="flex-1 py-3 rounded-xl bg-secondary hover:bg-accent transition-colors text-foreground font-medium flex items-center justify-center gap-2"
                    >
                        <SkipForward className="h-4 w-4" />
                        Omitir
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Check className="h-4 w-4" />
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
