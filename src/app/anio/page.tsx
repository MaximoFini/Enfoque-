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
    Flame,
    Calendar,
    TrendingUp,
    Award
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import for Recharts
const RechartsLineChart = dynamic(
    () => import("recharts").then(mod => mod.LineChart),
    { ssr: false }
);
const Line = dynamic(() => import("recharts").then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
    () => import("recharts").then(mod => mod.ResponsiveContainer),
    { ssr: false }
);

interface YearStats {
    totalHours: number;
    totalDays: number;
    bestStreak: number;
    currentStreak: number;
    monthlyData: Array<{ month: string; hours: number }>;
    categoryTotals: Array<{ name: string; hours: number; color: string; emoji: string }>;
    dailyData: Map<string, number>;
}

// Simplified GitHub-style Heatmap Component
function ActivityHeatmap({ dailyData, year }: { dailyData: Map<string, number>; year: number }) {
    // Generate all dates for the year - simplified approach
    const weeksData = useMemo(() => {
        const result: Array<Array<{ dateStr: string; level: number }>> = [];
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        // Adjust to start from previous Sunday
        const firstSunday = new Date(startDate);
        const dayOfWeek = firstSunday.getDay();
        firstSunday.setDate(firstSunday.getDate() - dayOfWeek);

        let currentWeek: Array<{ dateStr: string; level: number }> = [];
        const current = new Date(firstSunday);

        // Safety limit - max 53 weeks * 7 days = 371 iterations
        for (let i = 0; i < 371 && current <= endDate; i++) {
            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            const isInYear = current >= startDate && current <= endDate;
            const hours = dailyData.get(dateStr) || 0;

            let level = -1; // -1 = outside year
            if (isInYear) {
                level = 0;
                if (hours > 0) level = 1;
                if (hours >= 2) level = 2;
                if (hours >= 4) level = 3;
                if (hours >= 6) level = 4;
            }

            currentWeek.push({ dateStr, level });

            if (currentWeek.length === 7) {
                result.push(currentWeek);
                currentWeek = [];
            }

            current.setDate(current.getDate() + 1);
        }

        // Add remaining days if any
        if (currentWeek.length > 0) {
            result.push(currentWeek);
        }

        return result;
    }, [dailyData, year]);

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    const levelColors = [
        "bg-secondary", // 0 - no activity
        "bg-green-900/50", // 1 - low
        "bg-green-700/70", // 2 - medium-low
        "bg-green-500", // 3 - medium-high
        "bg-green-400", // 4 - high
    ];

    return (
        <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-2 text-xs text-muted-foreground">
                {months.map((month, i) => (
                    <div key={month} className="flex-1 text-center">
                        {month}
                    </div>
                ))}
            </div>

            <div className="flex gap-[2px]">
                {/* Heatmap grid */}
                {weeksData.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[2px]">
                        {week.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`w-3 h-3 rounded-sm ${day.level < 0
                                    ? "bg-transparent"
                                    : levelColors[day.level]
                                    }`}
                                title={day.level >= 0 ? day.dateStr : ""}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Menos</span>
                {levelColors.map((color, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
                ))}
                <span>Más</span>
            </div>
        </div>
    );
}

export default function AnioPage() {
    const { user } = useAuth();
    const [yearOffset, setYearOffset] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [yearStats, setYearStats] = useState<YearStats>({
        totalHours: 0,
        totalDays: 0,
        bestStreak: 0,
        currentStreak: 0,
        monthlyData: [],
        categoryTotals: [],
        dailyData: new Map(),
    });
    const [isLoading, setIsLoading] = useState(true);

    const currentYear = new Date().getFullYear() + yearOffset;

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

            const supabase = getSupabaseClient();
            if (!supabase) {
                setIsLoading(false);
                return;
            }

            const yearStart = new Date(currentYear, 0, 1);
            const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

            const { data: logsData } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("started_at", yearStart.toISOString())
                .lte("started_at", yearEnd.toISOString());

            const logs = logsData as any[];

            if (logs) {
                // Daily data for heatmap
                const dailyMap = new Map<string, number>();
                logs.forEach((log: any) => {
                    const d = new Date(log.started_at);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + log.duration_minutes / 60);
                });

                // Monthly data
                const monthlyMap = new Map<number, number>();
                logs.forEach((log: any) => {
                    const month = new Date(log.started_at).getMonth();
                    monthlyMap.set(month, (monthlyMap.get(month) || 0) + log.duration_minutes / 60);
                });

                const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                const monthlyData = monthNames.map((name, i) => ({
                    month: name,
                    hours: Math.round((monthlyMap.get(i) || 0) * 10) / 10,
                }));

                // Category totals
                const categoryMap = new Map<string, number>();
                logs.forEach((log: any) => {
                    if (log.category_id) {
                        categoryMap.set(log.category_id, (categoryMap.get(log.category_id) || 0) + log.duration_minutes / 60);
                    }
                });

                const categoryTotals = cats
                    .filter(c => !c.parent_id && categoryMap.has(c.id))
                    .map(cat => ({
                        name: cat.name,
                        hours: Math.round((categoryMap.get(cat.id) || 0) * 10) / 10,
                        color: cat.color || "#6366f1",
                        emoji: cat.emoji,
                    }))
                    .sort((a, b) => b.hours - a.hours);

                // Calculate streaks
                const sortedDates = Array.from(dailyMap.keys()).sort();
                let bestStreak = 0;
                let tempStreak = 1;

                for (let i = 1; i < sortedDates.length; i++) {
                    const prev = new Date(sortedDates[i - 1]);
                    const curr = new Date(sortedDates[i]);
                    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        bestStreak = Math.max(bestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
                bestStreak = Math.max(bestStreak, tempStreak);

                const totalMinutes = logs.reduce((sum, l) => sum + l.duration_minutes, 0);

                setYearStats({
                    totalHours: totalMinutes / 60,
                    totalDays: dailyMap.size,
                    bestStreak: sortedDates.length > 0 ? bestStreak : 0,
                    currentStreak: 0, // Simplified
                    monthlyData,
                    categoryTotals,
                    dailyData: dailyMap,
                });
            }

            setIsLoading(false);
        }

        loadData();
    }, [currentYear, user]);

    return (
        <MainLayout title="Año">
            <div className="space-y-6">
                {/* Year navigation */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setYearOffset(y => y - 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-foreground">
                                    {currentYear}
                                </h2>
                                {yearOffset !== 0 && (
                                    <button
                                        onClick={() => setYearOffset(0)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Ir a este año
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setYearOffset(y => y + 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-foreground" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Yearly stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {yearStats.totalHours.toFixed(0)}h
                            </p>
                            <p className="text-sm text-muted-foreground">Horas totales</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {yearStats.totalDays}
                            </p>
                            <p className="text-sm text-muted-foreground">Días activos</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {yearStats.bestStreak}
                            </p>
                            <p className="text-sm text-muted-foreground">Mejor racha</p>
                        </CardContent>
                    </Card>
                    <Card hover>
                        <CardContent className="p-4 text-center">
                            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                            <p className="text-3xl font-bold text-foreground">
                                {yearStats.currentStreak}
                            </p>
                            <p className="text-sm text-muted-foreground">Racha actual</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Heatmap */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Actividad del Año
                        </CardTitle>
                        <CardDescription>Historial de productividad diaria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isLoading && (
                            <ActivityHeatmap
                                dailyData={yearStats.dailyData}
                                year={currentYear}
                            />
                        )}
                        {isLoading && (
                            <div className="h-32 flex items-center justify-center text-muted-foreground">
                                Cargando...
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Monthly trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>📈 Tendencia Mensual</CardTitle>
                        <CardDescription>Horas por mes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {yearStats.monthlyData.some(d => d.hours > 0) ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsLineChart data={yearStats.monthlyData}>
                                        <XAxis
                                            dataKey="month"
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
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                                        />
                                    </RechartsLineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                No hay datos para este año
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Category totals */}
                {yearStats.categoryTotals.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>🏆 Totales por Categoría</CardTitle>
                            <CardDescription>Distribución anual del tiempo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {yearStats.categoryTotals.map((cat) => (
                                    <div
                                        key={cat.name}
                                        className="p-4 rounded-xl border border-border bg-secondary/30"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{cat.emoji}</span>
                                            <div>
                                                <p className="font-semibold text-foreground">{cat.name}</p>
                                                <p className="text-2xl font-bold text-foreground">{cat.hours}h</p>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (cat.hours / yearStats.totalHours) * 100)}%`,
                                                    backgroundColor: cat.color
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
