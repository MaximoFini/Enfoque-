"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { PomodoroTimer } from "@/components/timer/PomodoroTimer";
import { TimeBlockModal, type TimeBlockData } from "@/components/timer/TimeBlockModal";
import { WeeklyGoalsCard } from "@/components/goals/WeeklyGoalsCard";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useTasks } from "@/hooks/useTasks";
import { createTimeLogExtended, getCurrentUserId, getTimeLogsForToday, getCategories, isOtherWorkType } from "@/lib/supabase/services";
import type { Category } from "@/lib/supabase/types";
import { CheckCircle2, Clock, Plus, Brain, Zap } from "lucide-react";

export default function HoyPage() {
    const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [facultadCategoryId, setFacultadCategoryId] = useState<string | null>(null);
    const { todayProgress, totalTodayHours, refresh: refreshProgress } = useWeeklyProgress();

    // Tasks for today
    const {
        tasks: todayTasks,
        stats: taskStats,
        isLoading: tasksLoading,
        addTask,
        editTask,
        removeTask,
        complete: completeTask,
        uncomplete: uncompleteTask,
        reorder: reorderTasks,
    } = useTasks({ view: "today" });

    const [todayStats, setTodayStats] = useState({
        focusedHours: 0,
        deepHours: 0,
        shallowHours: 0,
    });

    // Load categories, Facultad category ID, and today's stats
    useEffect(() => {
        async function loadData() {
            // Get all categories
            const cats = await getCategories();
            // Filter to only parent categories (no parent_id)
            const parentCats = cats.filter((c: Category) => !c.parent_id);
            setCategories(parentCats);

            // Get Facultad category ID
            const facultad = cats.find((c: Category) => c.name.toLowerCase() === "facultad");
            if (facultad) {
                setFacultadCategoryId(facultad.id);
            }

            // Load today stats
            const userId = await getCurrentUserId();
            if (!userId) return;

            const logs = await getTimeLogsForToday(userId);
            // Filter out "other" work type entries (marked with __OTHER__ prefix in notes)
            const countableLogs = logs.filter(l => !isOtherWorkType(l.notes));
            const deepMinutes = countableLogs.filter(l => l.work_type === "deep").reduce((sum, l) => sum + l.duration_minutes, 0);
            const shallowMinutes = countableLogs.filter(l => l.work_type === "shallow").reduce((sum, l) => sum + l.duration_minutes, 0);

            setTodayStats({
                focusedHours: (deepMinutes + shallowMinutes) / 60,
                deepHours: deepMinutes / 60,
                shallowHours: shallowMinutes / 60,
            });
        }

        loadData();
    }, []);

    const handleTimeBlockSave = async (data: TimeBlockData) => {
        setIsSaving(true);
        const durationMinutes = Math.round(data.durationHours * 60);

        try {
            const userId = await getCurrentUserId();

            if (userId) {
                const now = new Date();
                const startedAt = new Date(now.getTime() - durationMinutes * 60 * 1000);

                await createTimeLogExtended({
                    userId,
                    title: data.title,
                    categoryId: data.categoryId || undefined,
                    durationMinutes,
                    workType: data.workType,
                    color: data.color,
                    startedAt,
                    endedAt: now,
                });

                refreshProgress();

                // Only update stats for deep/shallow work types
                if (data.workType !== "other") {
                    setTodayStats(prev => ({
                        focusedHours: prev.focusedHours + durationMinutes / 60,
                        deepHours: data.workType === "deep" ? prev.deepHours + durationMinutes / 60 : prev.deepHours,
                        shallowHours: data.workType === "shallow" ? prev.shallowHours + durationMinutes / 60 : prev.shallowHours,
                    }));
                }
            }
        } catch (error) {
            console.error("Error saving time block:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTimerLogSaved = () => {
        refreshProgress();

        (async () => {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const logs = await getTimeLogsForToday(userId);
            // Filter out "other" work type entries
            const countableLogs = logs.filter(l => !isOtherWorkType(l.notes));
            const deepMinutes = countableLogs.filter(l => l.work_type === "deep").reduce((sum, l) => sum + l.duration_minutes, 0);
            const shallowMinutes = countableLogs.filter(l => l.work_type === "shallow").reduce((sum, l) => sum + l.duration_minutes, 0);

            setTodayStats({
                focusedHours: (deepMinutes + shallowMinutes) / 60,
                deepHours: deepMinutes / 60,
                shallowHours: shallowMinutes / 60,
            });
        })();
    };

    // Handle Pomodoro completion - logs to Facultad as deep work
    const handlePomodoroComplete = async (minutes: number) => {
        if (minutes < 1) return;
        if (!facultadCategoryId) {
            console.warn("Facultad category not found - time not logged");
            return;
        }

        const userId = await getCurrentUserId();
        if (!userId) return;

        const now = new Date();
        const startedAt = new Date(now.getTime() - minutes * 60 * 1000);

        await createTimeLogExtended({
            userId,
            title: "Pomodoro",
            categoryId: facultadCategoryId,
            durationMinutes: minutes,
            workType: "deep", // Pomodoro is always deep work
            startedAt,
            endedAt: now,
        });

        // Refresh stats
        handleTimerLogSaved();
    };

    // Get current date in Spanish
    const today = new Date();
    const dateFormatter = new Intl.DateTimeFormat("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const formattedDate = dateFormatter.format(today);
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    // Get greeting based on time
    const hour = today.getHours();
    const greeting = hour < 12 ? "¡Buenos días!" : hour < 18 ? "¡Buenas tardes!" : "¡Buenas noches!";

    return (
        <MainLayout title="Hoy">
            <div className="space-y-6">
                {/* Timer Hero Section */}
                <TimerDisplay onLogSaved={handleTimerLogSaved} />

                {/* Pomodoro Timer - Full Width */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🍅 Pomodoro Timer
                        </CardTitle>
                        <CardDescription>
                            El tiempo se guarda automáticamente en Facultad como Deep Work
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <PomodoroTimer onComplete={handlePomodoroComplete} />
                    </CardContent>
                </Card>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setShowTimeBlockModal(true)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                            {isSaving ? "Guardando..." : "Registrar tiempo"}
                        </span>
                    </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hover>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {taskStats.todayCompleted}/{todayTasks.length + taskStats.todayCompleted}
                                </p>
                                <p className="text-xs text-muted-foreground">Tareas</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card hover>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {todayStats.focusedHours.toFixed(1)}h
                                </p>
                                <p className="text-xs text-muted-foreground">Enfocado hoy</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card hover>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <Brain className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {todayStats.deepHours.toFixed(1)}h
                                </p>
                                <p className="text-xs text-muted-foreground">Deep Work</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card hover className="col-span-2 lg:col-span-1">
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">{greeting} 👋</p>
                            <p className="text-sm font-medium text-foreground">{capitalizedDate}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Weekly Progress */}
                <WeeklyGoalsCard compact />

                {/* Main content grid - Tiempo por Categoría and Agenda */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Today's sessions by category - moved up */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>⏱️</span> Tiempo de Hoy por Categoría
                            </CardTitle>
                            <CardDescription>Desglose de tu actividad</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todayProgress.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {todayProgress.map(cat => (
                                        <div
                                            key={cat.categoryId}
                                            className="p-4 rounded-xl bg-secondary/50"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{cat.emoji}</span>
                                                <span className="font-medium text-foreground text-sm">{cat.categoryName}</span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {(cat.totalMinutes / 60).toFixed(1)}h
                                            </p>
                                            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Brain className="h-3 w-3" />
                                                    {(cat.deepMinutes / 60).toFixed(1)}h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    {(cat.shallowMinutes / 60).toFixed(1)}h
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 rounded-xl bg-secondary/50 border border-border/50 text-center">
                                    <p className="text-muted-foreground">
                                        Aún no hay sesiones registradas hoy
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Usa el Pomodoro o registra tiempo manualmente
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>📅</span> Agenda
                            </CardTitle>
                            <CardDescription>
                                Próximos eventos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-blue-500/10 border-l-4 border-blue-500">
                                    <p className="font-medium text-foreground">DSI - Clase teórica</p>
                                    <p className="text-sm text-muted-foreground">09:00 - 11:00</p>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-500/10 border-l-4 border-purple-500">
                                    <p className="font-medium text-foreground">Gym - Entrenamiento</p>
                                    <p className="text-sm text-muted-foreground">17:00 - 18:30</p>
                                </div>
                                <div className="p-3 rounded-xl bg-green-500/10 border-l-4 border-green-500">
                                    <p className="font-medium text-foreground">KEI - Reunión equipo</p>
                                    <p className="text-sm text-muted-foreground">20:00 - 21:00</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Time Block Modal */}
            <TimeBlockModal
                isOpen={showTimeBlockModal}
                onClose={() => setShowTimeBlockModal(false)}
                onSave={handleTimeBlockSave}
                categories={categories}
            />
        </MainLayout>
    );
}
