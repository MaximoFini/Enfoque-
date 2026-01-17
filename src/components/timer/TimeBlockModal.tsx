"use client";

import * as React from "react";
import { X, Brain, Zap, Palette, Clock } from "lucide-react";
import type { Category } from "@/lib/supabase/types";

// Color palette for "Other" work type
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

export interface TimeBlockData {
    title: string;
    categoryId: string | null;
    durationHours: number;
    workType: "deep" | "shallow" | "other";
    color?: string;
}

interface TimeBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TimeBlockData) => void;
    categories: Category[];
}

export function TimeBlockModal({ isOpen, onClose, onSave, categories }: TimeBlockModalProps) {
    const [title, setTitle] = React.useState("");
    const [categoryId, setCategoryId] = React.useState<string>("");
    const [durationHours, setDurationHours] = React.useState(1);
    const [workType, setWorkType] = React.useState<"deep" | "shallow" | "other">("deep");
    const [selectedColor, setSelectedColor] = React.useState(OTHER_COLORS[3]); // Default green

    const resetForm = () => {
        setTitle("");
        setCategoryId("");
        setDurationHours(1);
        setWorkType("deep");
        setSelectedColor(OTHER_COLORS[3]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            categoryId: categoryId || null,
            durationHours,
            workType,
            color: workType === "other" ? selectedColor : undefined,
        });

        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Registrar Tiempo</h3>
                            <p className="text-sm text-muted-foreground">Crear bloque de tiempo</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-1 hover:bg-secondary rounded-lg">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

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
                                {categories.map(cat => (
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
                            <select
                                value={durationHours}
                                onChange={(e) => setDurationHours(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                            >
                                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].map(h => (
                                    <option key={h} value={h}>
                                        {h}h
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={!title.trim()}
                        className="w-full py-3 rounded-xl gradient-primary text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Crear bloque
                    </button>
                </form>
            </div>
        </div>
    );
}
