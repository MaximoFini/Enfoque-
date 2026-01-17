"use client";

import * as React from "react";
import { X, Brain, Zap, Palette } from "lucide-react";
import { getCategories, createTimeLog, getCurrentUserId } from "@/lib/supabase/services";
import type { Category, WorkType } from "@/lib/supabase/types";

// Color palette for "Other" work type - same as planificador
const OTHER_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#78716c", // stone
    "#1e293b", // slate
];

interface TimerCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    timerWorkType: WorkType;
    durationMinutes: number;
    startedAt: Date;
}

export function TimerCompletionModal({
    isOpen,
    onClose,
    onComplete,
    timerWorkType,
    durationMinutes,
    startedAt,
}: TimerCompletionModalProps) {
    const [title, setTitle] = React.useState("");
    const [workType, setWorkType] = React.useState<"deep" | "shallow" | "other">(timerWorkType);
    const [selectedColor, setSelectedColor] = React.useState(OTHER_COLORS[3]); // Default green
    const [categoryId, setCategoryId] = React.useState<string>("");
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);

    // Load categories
    React.useEffect(() => {
        async function loadCategories() {
            const cats = await getCategories();
            setCategories(cats.filter((c: Category) => !c.parent_id));
        }
        loadCategories();
    }, []);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle("");
            setWorkType(timerWorkType);
            setCategoryId("");
            setSelectedColor(OTHER_COLORS[3]);
        }
    }, [isOpen, timerWorkType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSaving(true);

        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                console.error("No user ID found");
                setIsSaving(false);
                return;
            }

            // Calculate the correct start and end times
            const endTime = new Date(); // Current time when timer completed
            const calculatedStartTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);

            // Create time_log in Supabase (only for deep/shallow, not "other")
            if (workType !== "other") {
                await createTimeLog({
                    userId,
                    categoryId: categoryId || "general", // Use categoryId if selected
                    durationMinutes,
                    workType: workType as WorkType,
                    startedAt: calculatedStartTime,
                    endedAt: endTime,
                });
            }

            // Create block in localStorage for planificador display
            createPlannerBlock(calculatedStartTime, endTime);

            onComplete();
        } catch (error) {
            console.error("Error saving timer completion:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const createPlannerBlock = (startTime: Date, endTime: Date) => {
        // Calculate the week's Monday for localStorage key
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const storageKey = `planner_blocks_${monday.toISOString().split('T')[0]}`;

        // Get existing blocks
        const existingBlocks = JSON.parse(localStorage.getItem(storageKey) || "[]");

        // Calculate day index (Mon=0, Sun=6)
        const dayOfWeek = (startTime.getDay() + 6) % 7;

        // Calculate start hour as decimal (e.g., 13.5 for 13:30)
        const startHour = startTime.getHours() + startTime.getMinutes() / 60;

        // Calculate duration in hours
        const durationHours = durationMinutes / 60;

        // Create new block
        const newBlock = {
            id: crypto.randomUUID(),
            title: title.trim(),
            category_id: categoryId || null,
            day: dayOfWeek,
            start_hour: startHour,
            duration_hours: durationHours,
            work_type: workType,
            color: workType === "other" ? selectedColor : undefined,
            isLogged: true, // Mark as logged so it displays correctly
        };

        // Save to localStorage
        existingBlocks.push(newBlock);
        localStorage.setItem(storageKey, JSON.stringify(existingBlocks));
    };

    if (!isOpen) return null;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
        return `${mins} min`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="gradient-primary p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">🎉 ¡Sesión completada!</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-white/80 text-sm">
                        {formatDuration(durationMinutes)} de {timerWorkType === "deep" ? "Deep Work" : "Shallow Work"}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ej: Estudio de Cálculo"
                            autoFocus
                            required
                            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                        />
                    </div>

                    {/* Work type selector - 3 columns */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de trabajo
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setWorkType("deep")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "deep"
                                    ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Brain className="h-4 w-4" />
                                <span className="font-medium text-sm">Deep</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkType("shallow")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "shallow"
                                    ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Zap className="h-4 w-4" />
                                <span className="font-medium text-sm">Shallow</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkType("other")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "other"
                                    ? "border-2 text-white"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                                style={{
                                    backgroundColor: workType === "other" ? `${selectedColor}40` : undefined,
                                    borderColor: workType === "other" ? selectedColor : undefined,
                                    color: workType === "other" ? selectedColor : undefined,
                                }}
                            >
                                <Palette className="h-4 w-4" />
                                <span className="font-medium text-sm">Otro</span>
                            </button>
                        </div>
                    </div>

                    {/* Color picker for "Other" */}
                    {workType === "other" && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Color
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                                {OTHER_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-10 h-10 rounded-lg transition-all ${selectedColor === color
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                                            : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category and Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Categoría
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Duración
                            </label>
                            <div className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-center font-medium">
                                {formatDuration(durationMinutes)}
                            </div>
                        </div>
                    </div>

                    {/* Time display */}
                    <div className="text-sm text-muted-foreground bg-secondary/50 rounded-xl p-3 text-center">
                        📅 Este bloque se registrará desde las{" "}
                        <span className="font-medium text-foreground">
                            {new Date(Date.now() - durationMinutes * 60 * 1000).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>{" "}
                        hasta las{" "}
                        <span className="font-medium text-foreground">
                            {new Date().toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isSaving || !title.trim()}
                        className="w-full py-3 rounded-xl gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSaving ? "Guardando..." : "Crear bloque"}
                    </button>

                    {/* Skip button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    >
                        Omitir
                    </button>
                </form>
            </div>
        </div>
    );
}
