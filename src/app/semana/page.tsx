"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { WeeklyGoalsCard } from "@/components/goals/WeeklyGoalsCard";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/context/AuthContext";
import { getTimeLogsForWeek, getCurrentUserId } from "@/lib/supabase/services";
import {
    ChevronLeft,
    ChevronRight,
    Brain,
    Zap,
    Target,
    CheckCircle2,
    TrendingUp
} from "lucide-react";

export default function SemanaPage() {
    const { user } = useAuth();
    const [weekOffset, setWeekOffset] = useState(0);
    const { weeklyProgress, totalWeeklyHours, totalWeeklyTarget, daysRemaining } = useWeeklyProgress();
    const { stats: taskStats } = useTasks({ view: "all" });

    // Calculate week dates
    const weekData = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (weekOffset * 7);

        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const days = [];
        const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                name: dayNames[i],
                date: date.getDate().toString(),
                fullDate: date,
                isToday: date.toDateString() === today.toDateString(),
            });
        }

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        const weekLabel = `${monday.getDate()} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;

        return { days, weekLabel, monday, sunday };
    }, [weekOffset]);

    // Weekly stats
    const [weekStats, setWeekStats] = useState({
        totalHours: 0,
        deepHours: 0,
        shallowHours: 0,
        sessions: 0,
    });

    useEffect(() => {
        async function loadWeekStats() {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const logs = await getTimeLogsForWeek(userId, weekData.monday, weekData.sunday);

            const totalMinutes = logs.reduce((sum, l) => sum + l.duration_minutes, 0);
            const deepMinutes = logs.filter(l => l.work_type === "deep").reduce((sum, l) => sum + l.duration_minutes, 0);
            const shallowMinutes = logs.filter(l => l.work_type === "shallow").reduce((sum, l) => sum + l.duration_minutes, 0);

            setWeekStats({
                totalHours: totalMinutes / 60,
                deepHours: deepMinutes / 60,
                shallowHours: shallowMinutes / 60,
                sessions: logs.length,
            });
        }

        loadWeekStats();
    }, [weekData, user]);

    // Progress percentage
    const progressPercent = totalWeeklyTarget > 0
        ? Math.min(100, Math.round((totalWeeklyHours / totalWeeklyTarget) * 100))
        : 0;


    return (
        <MainLayout title="Semana">
            <div className="space-y-6">
                {/* Week navigation */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setWeekOffset(w => w - 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {weekData.weekLabel}
                                </h2>
                                {weekOffset !== 0 && (
                                    <button
                                        onClick={() => setWeekOffset(0)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Ir a esta semana
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setWeekOffset(w => w + 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {weekData.days.map((day) => (
                                <button
                                    key={day.name + day.date}
                                    className={`p-3 rounded-xl text-center transition-all ${day.isToday
                                        ? "gradient-primary text-white"
                                        : "hover:bg-secondary"
                                        }`}
                                >
                                    <p className={`text-xs ${day.isToday ? "text-white/80" : "text-muted-foreground"}`}>
                                        {day.name}
                                    </p>
                                    <p className={`text-lg font-bold ${day.isToday ? "text-white" : "text-foreground"}`}>
                                        {day.date}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Progress Goals */}
                <WeeklyGoalsCard title="🎯 Metas de la Semana" />

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Total Hours */}
                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {weekStats.totalHours.toFixed(1)}h
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        de {totalWeeklyTarget}h meta
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full gradient-primary transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deep Work */}
                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Brain className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {weekStats.deepHours.toFixed(1)}h
                                    </p>
                                    <p className="text-xs text-muted-foreground">Deep Work</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shallow Work */}
                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                    <Zap className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {weekStats.shallowHours.toFixed(1)}h
                                    </p>
                                    <p className="text-xs text-muted-foreground">Shallow Work</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Second row */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Deep vs Shallow comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Deep vs Shallow
                            </CardTitle>
                            <CardDescription>Distribución del trabajo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Deep Work Bar */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Brain className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm font-medium text-foreground">Deep Work</span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">
                                            {weekStats.deepHours.toFixed(1)}h
                                        </span>
                                    </div>
                                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: weekStats.totalHours > 0
                                                    ? `${(weekStats.deepHours / weekStats.totalHours) * 100}%`
                                                    : '0%'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Shallow Work Bar */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm font-medium text-foreground">Shallow Work</span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground">
                                            {weekStats.shallowHours.toFixed(1)}h
                                        </span>
                                    </div>
                                    <div className="h-4 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: weekStats.totalHours > 0
                                                    ? `${(weekStats.shallowHours / weekStats.totalHours) * 100}%`
                                                    : '0%'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Ratio */}
                                <div className="pt-2 border-t border-border">
                                    <p className="text-sm text-muted-foreground">
                                        Ratio Deep/Shallow: {" "}
                                        <span className="font-bold text-foreground">
                                            {weekStats.shallowHours > 0
                                                ? (weekStats.deepHours / weekStats.shallowHours).toFixed(1)
                                                : weekStats.deepHours > 0 ? "∞" : "0"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Tareas
                            </CardTitle>
                            <CardDescription>Progreso de la semana</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center p-4 rounded-xl bg-green-500/10">
                                    <p className="text-3xl font-bold text-green-500">
                                        {taskStats.todayCompleted}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Completadas hoy</p>
                                </div>
                                <div className="text-center p-4 rounded-xl bg-secondary">
                                    <p className="text-3xl font-bold text-foreground">
                                        {taskStats.pending}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Pendientes</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progreso total</span>
                                    <span className="font-bold text-foreground">
                                        {taskStats.completed}/{taskStats.total}
                                    </span>
                                </div>
                                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: taskStats.total > 0
                                                ? `${(taskStats.completed / taskStats.total) * 100}%`
                                                : '0%'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Quedan <span className="font-bold text-foreground">{daysRemaining} días</span> para completar la semana
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
