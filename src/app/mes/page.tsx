"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCurrentUserId } from "@/lib/supabase/services";
import type { Category } from "@/lib/supabase/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
    ChevronLeft,
    ChevronRight,
    Target,
    TrendingUp,
    BarChart3,
    PieChart as PieChartIcon,
    Calendar
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for Recharts (client-only)
const RechartsLineChart = dynamic(
    () => import("recharts").then(mod => mod.LineChart),
    { ssr: false }
);
const RechartsBarChart = dynamic(
    () => import("recharts").then(mod => mod.BarChart),
    { ssr: false }
);
const RechartsPieChart = dynamic(
    () => import("recharts").then(mod => mod.PieChart),
    { ssr: false }
);
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(
    () => import("recharts").then(mod => mod.ResponsiveContainer),
    { ssr: false }
);

interface MonthStats {
    totalHours: number;
    totalTasks: number;
    productiveDays: number;
    avgHoursPerDay: number;
    weeklyData: Array<{ week: string; hours: number }>;
    categoryData: Array<{ name: string; hours: number; color: string }>;
}

export default function MesPage() {
    const { user } = useAuth();
    const [monthOffset, setMonthOffset] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [monthStats, setMonthStats] = useState<MonthStats>({
        totalHours: 0,
        totalTasks: 0,
        productiveDays: 0,
        avgHoursPerDay: 0,
        weeklyData: [],
        categoryData: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    // Calculate month data
    const monthData = useMemo(() => {
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week for first day (0 = Sunday, adjust for Monday start)
        let startDayOfWeek = firstDay.getDay();
        startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        // Build weeks array
        const weeks: (number | null)[][] = [];
        let currentWeek: (number | null)[] = [];

        // Add empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            currentWeek.push(null);
        }

        // Add days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        // Fill remaining days
        while (currentWeek.length > 0 && currentWeek.length < 7) {
            currentWeek.push(null);
        }
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        return {
            weeks,
            monthLabel: `${monthNames[month]} ${year}`,
            firstDay,
            lastDay,
            currentDay: today.getMonth() === month && today.getFullYear() === year ? today.getDate() : null,
        };
    }, [monthOffset]);

    // Load data
    useEffect(() => {
        async function loadData() {
            setIsLoading(true);
            const userId = await getCurrentUserId();
            if (!userId) {
                setIsLoading(false);
                return;
            }

            const [cats] = await Promise.all([getCategories()]);
            setCategories(cats.filter(c => !c.parent_id));

            // Fetch time logs for the month
            const supabase = getSupabaseClient();
            if (!supabase) {
                setIsLoading(false);
                return;
            }

            const { data: logs } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("started_at", monthData.firstDay.toISOString())
                .lte("started_at", monthData.lastDay.toISOString());

            if (logs) {
                // Calculate stats
                const totalMinutes = logs.reduce((sum, l) => sum + l.duration_minutes, 0);
                const uniqueDays = new Set(logs.map(l => l.logged_at.split('T')[0])).size;

                // Weekly data
                const weeklyMap = new Map<number, number>();
                logs.forEach(log => {
                    const logDate = new Date(log.logged_at);
                    const weekNum = Math.ceil(logDate.getDate() / 7);
                    weeklyMap.set(weekNum, (weeklyMap.get(weekNum) || 0) + log.duration_minutes / 60);
                });

                const weeklyData = Array.from({ length: 5 }, (_, i) => ({
                    week: `Sem ${i + 1}`,
                    hours: Math.round((weeklyMap.get(i + 1) || 0) * 10) / 10,
                }));

                // Category data
                const categoryMap = new Map<string, number>();
                logs.forEach(log => {
                    if (log.category_id) {
                        categoryMap.set(log.category_id, (categoryMap.get(log.category_id) || 0) + log.duration_minutes / 60);
                    }
                });

                const categoryData = cats
                    .filter(c => !c.parent_id && categoryMap.has(c.id))
                    .map(cat => ({
                        name: cat.name,
                        hours: Math.round((categoryMap.get(cat.id) || 0) * 10) / 10,
                        color: cat.color,
                    }))
                    .sort((a, b) => b.hours - a.hours);

                setMonthStats({
                    totalHours: totalMinutes / 60,
                    totalTasks: 0, // TODO: Add task counting
                    productiveDays: uniqueDays,
                    avgHoursPerDay: uniqueDays > 0 ? (totalMinutes / 60) / uniqueDays : 0,
                    weeklyData,
                    categoryData,
                });
            }

            setIsLoading(false);
        }

        loadData();
    }, [monthData, user]);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

    return (
        <MainLayout title="Mes">
            <div className="space-y-6">
                {/* Month navigation & calendar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => setMonthOffset(m => m - 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-foreground">
                                    {monthData.monthLabel}
                                </h2>
                                {monthOffset !== 0 && (
                                    <button
                                        onClick={() => setMonthOffset(0)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Ir a este mes
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setMonthOffset(m => m + 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-foreground" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid - compact */}
                        <div className="space-y-1">
                            {monthData.weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                    {week.map((day, dayIndex) => (
                                        <button
                                            key={dayIndex}
                                            disabled={!day}
                                            className={`p-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${day === monthData.currentDay
                                                ? "gradient-primary text-white"
                                                : day
                                                    ? "hover:bg-secondary text-foreground"
                                                    : "text-transparent cursor-default"
                                                }`}
                                        >
                                            {day || ""}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {monthStats.totalHours.toFixed(1)}h
                            </p>
                            <p className="text-sm text-muted-foreground">Tiempo total</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {monthStats.productiveDays}
                            </p>
                            <p className="text-sm text-muted-foreground">Días productivos</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {monthStats.avgHoursPerDay.toFixed(1)}h
                            </p>
                            <p className="text-sm text-muted-foreground">Promedio/día</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <BarChart3 className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {monthStats.categoryData.length}
                            </p>
                            <p className="text-sm text-muted-foreground">Categorías activas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Weekly trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Tendencia Semanal
                            </CardTitle>
                            <CardDescription>Horas por semana del mes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {monthStats.weeklyData.some(d => d.hours > 0) ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={monthStats.weeklyData}>
                                            <XAxis
                                                dataKey="week"
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                            />
                                            <Bar
                                                dataKey="hours"
                                                fill="hsl(var(--primary))"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    No hay datos para este mes
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Category distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-primary" />
                                Distribución por Categoría
                            </CardTitle>
                            <CardDescription>Tiempo dedicado a cada área</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {monthStats.categoryData.length > 0 ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={monthStats.categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                dataKey="hours"
                                                nameKey="name"
                                                label={({ name, percent }) =>
                                                    `${name} ${(percent * 100).toFixed(0)}%`
                                                }
                                            >
                                                {monthStats.categoryData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color || COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    No hay datos para este mes
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Category breakdown */}
                {monthStats.categoryData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>📊 Desglose por Categoría</CardTitle>
                            <CardDescription>Detalle de horas por área</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {monthStats.categoryData.map((cat, index) => (
                                    <div key={cat.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-foreground">{cat.name}</span>
                                            <span className="text-sm font-bold text-foreground">{cat.hours}h</span>
                                        </div>
                                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${(cat.hours / monthStats.totalHours) * 100}%`,
                                                    backgroundColor: cat.color || COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
