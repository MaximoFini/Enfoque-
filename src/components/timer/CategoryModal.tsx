"use client";

import * as React from "react";
import { X, ChevronLeft } from "lucide-react";
import { CATEGORIES, FACULTAD_SUBCATEGORIES, hasSubcategories, type CategoryData } from "@/lib/data/categories";
import type { WorkType } from "@/lib/supabase/types";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (categoryId: string, subcategoryId?: string) => void;
    workType: WorkType;
    duration: number;
}

export function CategoryModal({ isOpen, onClose, onSave, workType, duration }: CategoryModalProps) {
    const [selectedCategory, setSelectedCategory] = React.useState<CategoryData | null>(null);
    const [showSubcategories, setShowSubcategories] = React.useState(false);

    const handleCategoryClick = (category: CategoryData) => {
        if (hasSubcategories(category.id)) {
            setSelectedCategory(category);
            setShowSubcategories(true);
        } else {
            onSave(category.id);
            resetState();
        }
    };

    const handleSubcategoryClick = (subcategory: CategoryData) => {
        if (selectedCategory) {
            onSave(selectedCategory.id, subcategory.id);
            resetState();
        }
    };

    const handleBack = () => {
        setShowSubcategories(false);
        setSelectedCategory(null);
    };

    const resetState = () => {
        setSelectedCategory(null);
        setShowSubcategories(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
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
            <div className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="gradient-primary p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        {showSubcategories ? (
                            <button
                                onClick={handleBack}
                                className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}
                        <button
                            onClick={handleClose}
                            className="p-2 -mr-2 rounded-xl hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-1">
                            {showSubcategories ? `📚 ${selectedCategory?.name}` : "🎉 ¡Sesión completada!"}
                        </h2>
                        <p className="text-white/80 text-sm">
                            {showSubcategories
                                ? "Selecciona la materia"
                                : `${duration} min de ${workType === "deep" ? "Deep Work" : "Shallow Work"}`
                            }
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                        {showSubcategories
                            ? "¿En qué materia trabajaste?"
                            : "¿En qué categoría trabajaste?"
                        }
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {showSubcategories ? (
                            FACULTAD_SUBCATEGORIES.map((subcategory) => (
                                <button
                                    key={subcategory.id}
                                    onClick={() => handleSubcategoryClick(subcategory)}
                                    className="p-4 rounded-2xl bg-secondary hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                                >
                                    <span className="text-2xl mb-2 block">{subcategory.emoji}</span>
                                    <span className="font-medium text-foreground">{subcategory.name}</span>
                                </button>
                            ))
                        ) : (
                            CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category)}
                                    className="p-4 rounded-2xl bg-secondary hover:bg-accent transition-all hover:scale-[1.02] active:scale-[0.98] text-left"
                                    style={{
                                        borderLeft: `4px solid ${category.color}`
                                    }}
                                >
                                    <span className="text-2xl mb-2 block">{category.emoji}</span>
                                    <span className="font-medium text-foreground">{category.name}</span>
                                    {hasSubcategories(category.id) && (
                                        <span className="text-xs text-muted-foreground block mt-1">
                                            Tiene subcategorías →
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full mt-4 p-3 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    >
                        Omitir clasificación
                    </button>
                </div>
            </div>
        </div>
    );
}
