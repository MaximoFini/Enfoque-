"use client";

import * as React from "react";
import { X, Clock, Brain, Zap } from "lucide-react";
import { CATEGORIES, FACULTAD_SUBCATEGORIES, hasSubcategories, type CategoryData } from "@/lib/data/categories";
import type { WorkType } from "@/lib/supabase/types";

interface QuickLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: QuickLogData) => void;
}

export interface QuickLogData {
    hours: number;
    minutes: number;
    categoryId: string;
    subcategoryId?: string;
    workType: WorkType;
}

export function QuickLogModal({ isOpen, onClose, onSave }: QuickLogModalProps) {
    const [hours, setHours] = React.useState(0);
    const [minutes, setMinutes] = React.useState(30);
    const [workType, setWorkType] = React.useState<WorkType>("deep");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");
    const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>("");

    const resetForm = () => {
        setHours(0);
        setMinutes(30);
        setWorkType("deep");
        setSelectedCategory("");
        setSelectedSubcategory("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSave = () => {
        if (!selectedCategory || (hours === 0 && minutes === 0)) return;

        onSave({
            hours,
            minutes,
            categoryId: selectedCategory,
            subcategoryId: selectedSubcategory || undefined,
            workType,
        });

        handleClose();
    };

    const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory);
    const showSubcategories = selectedCategory && hasSubcategories(selectedCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Registrar Tiempo</h2>
                            <p className="text-sm text-muted-foreground">Añadir entrada manual</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Duración
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={hours}
                                        onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                        className="w-full h-12 px-4 rounded-xl bg-secondary text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm text-muted-foreground">h</span>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-muted-foreground">:</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={minutes}
                                        onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                        className="w-full h-12 px-4 rounded-xl bg-secondary text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="text-sm text-muted-foreground">m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Type */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Tipo de trabajo
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setWorkType("deep")}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${workType === "deep"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <Brain className={`h-5 w-5 ${workType === "deep" ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="text-left">
                                    <p className={`font-medium ${workType === "deep" ? "text-primary" : "text-foreground"}`}>
                                        Deep Work
                                    </p>
                                    <p className="text-xs text-muted-foreground">Trabajo profundo</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setWorkType("shallow")}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${workType === "shallow"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <Zap className={`h-5 w-5 ${workType === "shallow" ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="text-left">
                                    <p className={`font-medium ${workType === "shallow" ? "text-primary" : "text-foreground"}`}>
                                        Shallow Work
                                    </p>
                                    <p className="text-xs text-muted-foreground">Tareas simples</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-3">
                            Categoría
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        setSelectedCategory(category.id);
                                        setSelectedSubcategory("");
                                    }}
                                    className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${selectedCategory === category.id
                                            ? "bg-primary/20 ring-2 ring-primary"
                                            : "bg-secondary hover:bg-accent"
                                        }`}
                                >
                                    <span className="text-xl">{category.emoji}</span>
                                    <span className="text-xs font-medium text-foreground truncate w-full text-center">
                                        {category.name.split(" ")[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subcategory */}
                    {showSubcategories && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Subcategoría de {selectedCategoryData?.name}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {FACULTAD_SUBCATEGORIES.map((sub) => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubcategory(sub.id)}
                                        className={`p-3 rounded-xl transition-all ${selectedSubcategory === sub.id
                                                ? "bg-primary/20 ring-2 ring-primary"
                                                : "bg-secondary hover:bg-accent"
                                            }`}
                                    >
                                        <span className="text-sm font-medium text-foreground">{sub.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleSave}
                        disabled={!selectedCategory || (hours === 0 && minutes === 0)}
                        className="w-full py-4 rounded-xl gradient-primary text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Guardar Registro
                    </button>
                </div>
            </div>
        </div>
    );
}
