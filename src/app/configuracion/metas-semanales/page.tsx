"use client";

import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CATEGORIES } from "@/lib/data/categories";
import {
    getWeeklyGoals,
    upsertWeeklyGoal,
    deleteWeeklyGoal,
    getCurrentUserId,
    getSystemCategories
} from "@/lib/supabase/services";
import { Target, Plus, Minus, Save, Check, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Category } from "@/lib/supabase/types";

interface GoalInput {
    categoryId: string;
    categoryName: string;
    emoji: string;
    color: string;
    targetHours: number;
    enabled: boolean;
}

export default function MetasSemanalesPage() {
    const [goals, setGoals] = React.useState<GoalInput[]>([]);
    const [saved, setSaved] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [userId, setUserId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    // Load categories and existing goals
    React.useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            setError(null);

            try {
                const currentUserId = await getCurrentUserId();
                setUserId(currentUserId);

                // Try to get categories from Supabase, fallback to local
                let categories: Array<{ id: string; name: string; emoji: string; color: string }>;

                if (currentUserId) {
                    const supabaseCategories = await getSystemCategories();
                    if (supabaseCategories.length > 0) {
                        categories = supabaseCategories.map(c => ({
                            id: c.id,
                            name: c.name,
                            emoji: c.emoji,
                            color: c.color || "#6366f1",
                        }));
                    } else {
                        categories = CATEGORIES;
                    }
                } else {
                    categories = CATEGORIES;
                }

                // Load existing goals
                let existingGoals: Record<string, number> = {};
                if (currentUserId) {
                    const weeklyGoals = await getWeeklyGoals(currentUserId);
                    existingGoals = weeklyGoals.reduce((acc, g) => {
                        acc[g.category_id] = Number(g.target_hours);
                        return acc;
                    }, {} as Record<string, number>);
                }

                // Initialize goals state
                const initialGoals = categories.map(cat => ({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    emoji: cat.emoji,
                    color: cat.color,
                    targetHours: existingGoals[cat.id] || 0,
                    enabled: cat.id in existingGoals,
                }));

                setGoals(initialGoals);
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Error al cargar las categorías");
                // Fallback to local categories
                setGoals(CATEGORIES.map(cat => ({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    emoji: cat.emoji,
                    color: cat.color,
                    targetHours: 0,
                    enabled: false,
                })));
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    const handleToggle = (categoryId: string) => {
        setGoals(prev => prev.map(g =>
            g.categoryId === categoryId
                ? { ...g, enabled: !g.enabled, targetHours: g.enabled ? 0 : 10 }
                : g
        ));
        setSaved(false);
    };

    const handleHoursChange = (categoryId: string, delta: number) => {
        setGoals(prev => prev.map(g =>
            g.categoryId === categoryId
                ? { ...g, targetHours: Math.max(0, Math.min(100, g.targetHours + delta)) }
                : g
        ));
        setSaved(false);
    };

    const handleInputChange = (categoryId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setGoals(prev => prev.map(g =>
            g.categoryId === categoryId
                ? { ...g, targetHours: Math.max(0, Math.min(100, numValue)) }
                : g
        ));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!userId) {
            setError("Debes iniciar sesión para guardar metas");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const enabledGoals = goals.filter(g => g.enabled && g.targetHours > 0);
            const disabledGoals = goals.filter(g => !g.enabled || g.targetHours === 0);

            // Upsert enabled goals
            for (const goal of enabledGoals) {
                await upsertWeeklyGoal(userId, goal.categoryId, goal.targetHours);
            }

            // Delete disabled goals
            for (const goal of disabledGoals) {
                await deleteWeeklyGoal(userId, goal.categoryId);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Error saving goals:", err);
            setError("Error al guardar las metas");
        } finally {
            setIsSaving(false);
        }
    };

    const totalHours = goals.filter(g => g.enabled).reduce((sum, g) => sum + g.targetHours, 0);
    const enabledCount = goals.filter(g => g.enabled).length;

    if (isLoading) {
        return (
            <MainLayout title="Metas Semanales">
                <div className="space-y-6 max-w-3xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-40 bg-secondary rounded-3xl" />
                        <div className="h-96 bg-secondary rounded-3xl" />
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Metas Semanales">
            <div className="space-y-6 max-w-3xl">
                {/* Back button */}
                <Link
                    href="/configuracion"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Configuración
                </Link>

                {/* Error message */}
                {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Auth warning */}
                {!userId && (
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            Inicia sesión para guardar tus metas. Los cambios actuales no se guardarán.
                        </p>
                    </div>
                )}

                {/* Header card */}
                <Card className="overflow-hidden">
                    <div className="gradient-primary p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Target className="h-7 w-7 text-white" />
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl font-bold">Metas Semanales</h2>
                                <p className="text-white/80">
                                    Define cuántas horas quieres dedicar a cada categoría
                                </p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Meta total semanal</p>
                                <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Categorías activas</p>
                                <p className="text-2xl font-bold text-foreground">{enabledCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Goals list */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configura tus metas</CardTitle>
                        <CardDescription>
                            Activa las categorías y ajusta las horas objetivo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {goals.map(goal => (
                                <div
                                    key={goal.categoryId}
                                    className={`p-4 rounded-2xl border transition-all ${goal.enabled
                                            ? 'bg-secondary/50 border-primary/30'
                                            : 'bg-background border-border/50 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => handleToggle(goal.categoryId)}
                                            className="flex items-center gap-3 flex-1 text-left"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${goal.enabled ? 'scale-100' : 'scale-90 grayscale'
                                                    }`}
                                                style={{ backgroundColor: `${goal.color}20` }}
                                            >
                                                {goal.emoji}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{goal.categoryName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {goal.enabled ? `${goal.targetHours}h por semana` : 'Click para activar'}
                                                </p>
                                            </div>
                                        </button>

                                        {goal.enabled && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleHoursChange(goal.categoryId, -1)}
                                                    className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                                                    disabled={goal.targetHours <= 0}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>

                                                <input
                                                    type="number"
                                                    value={goal.targetHours}
                                                    onChange={(e) => handleInputChange(goal.categoryId, e.target.value)}
                                                    className="w-16 h-8 text-center rounded-lg bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    min="0"
                                                    max="100"
                                                />

                                                <button
                                                    onClick={() => handleHoursChange(goal.categoryId, 1)}
                                                    className="w-8 h-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors"
                                                    disabled={goal.targetHours >= 100}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Toggle indicator */}
                                        <button
                                            className={`ml-3 w-12 h-6 rounded-full transition-colors flex items-center ${goal.enabled ? 'bg-primary justify-end' : 'bg-secondary justify-start'
                                                }`}
                                            onClick={() => handleToggle(goal.categoryId)}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-all`} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Save button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !userId}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${saved
                                ? 'bg-green-500 text-white'
                                : 'gradient-primary text-white hover:opacity-90'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : saved ? (
                            <>
                                <Check className="h-4 w-4" />
                                ¡Guardado!
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Guardar metas
                            </>
                        )}
                    </button>
                </div>

                {/* Tips */}
                <Card className="border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                💡
                            </div>
                            <div>
                                <p className="font-medium text-foreground">Consejo</p>
                                <p className="text-sm text-muted-foreground">
                                    Empieza con metas realistas. Es mejor empezar bajo y aumentar
                                    gradualmente que frustrarte con metas muy altas.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
