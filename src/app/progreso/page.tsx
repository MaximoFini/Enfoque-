"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUserId } from "@/lib/supabase/services";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Trophy, Flame, Target, TrendingUp, Download, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ComparisonData {
    current: { hours: number; tasks: number; days: number };
    past: { hours: number; tasks: number; days: number };
}

export default function ProgresoPage() {
    const { user } = useAuth();
    const [comparisonMonths, setComparisonMonths] = useState(1);
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [exportRange, setExportRange] = useState<"week" | "month" | "year">("month");
    const [isExporting, setIsExporting] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        currentStreak: 0,
        bestStreak: 0,
        totalHours: 0,
        tasksCompleted: 0,
    });

    // Load comparison data
    useEffect(() => {
        async function loadComparison() {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const supabase = getSupabaseClient();
            if (!supabase) return;

            const now = new Date();
            const currentStart = new Date(now);
            currentStart.setMonth(currentStart.getMonth() - 1);

            const pastStart = new Date(now);
            pastStart.setMonth(pastStart.getMonth() - comparisonMonths - 1);
            const pastEnd = new Date(now);
            pastEnd.setMonth(pastEnd.getMonth() - comparisonMonths);

            // Get current period data
            const { data: currentLogs } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("logged_at", currentStart.toISOString())
                .lte("logged_at", now.toISOString());

            // Get past period data
            const { data: pastLogs } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("logged_at", pastStart.toISOString())
                .lte("logged_at", pastEnd.toISOString());

            const currentHours = (currentLogs || []).reduce((sum, l) => sum + l.duration_minutes, 0) / 60;
            const pastHours = (pastLogs || []).reduce((sum, l) => sum + l.duration_minutes, 0) / 60;

            const currentDays = new Set((currentLogs || []).map(l => l.logged_at.split('T')[0])).size;
            const pastDays = new Set((pastLogs || []).map(l => l.logged_at.split('T')[0])).size;

            setComparison({
                current: { hours: currentHours, tasks: 0, days: currentDays },
                past: { hours: pastHours, tasks: 0, days: pastDays },
            });

            // Calculate total stats
            const { data: allLogs } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId);

            if (allLogs) {
                setStats(prev => ({
                    ...prev,
                    totalHours: allLogs.reduce((sum, l) => sum + l.duration_minutes, 0) / 60,
                }));
            }
        }

        loadComparison();
    }, [user, comparisonMonths]);

    // Export to CSV
    const exportCSV = async () => {
        setIsExporting(true);
        const userId = await getCurrentUserId();
        if (!userId) {
            setIsExporting(false);
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setIsExporting(false);
            return;
        }

        const now = new Date();
        let startDate = new Date();

        switch (exportRange) {
            case "week":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "month":
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case "year":
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        const { data: logs } = await supabase
            .from("time_logs")
            .select("*")
            .eq("user_id", userId)
            .gte("logged_at", startDate.toISOString())
            .lte("logged_at", now.toISOString())
            .order("logged_at", { ascending: true });

        if (logs && logs.length > 0) {
            const headers = ["Fecha", "Hora Inicio", "Duración (min)", "Tipo", "Categoría"];
            const rows = logs.map(log => [
                new Date(log.logged_at).toLocaleDateString("es-ES"),
                new Date(log.logged_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
                log.duration_minutes,
                log.work_type || "N/A",
                log.category_id || "Sin categoría",
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `enfoque_export_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        }

        setIsExporting(false);
    };

    // Get comparison indicator
    const getIndicator = (current: number, past: number) => {
        if (current > past) return { icon: ArrowUp, color: "text-green-500", label: "más" };
        if (current < past) return { icon: ArrowDown, color: "text-red-500", label: "menos" };
        return { icon: Minus, color: "text-muted-foreground", label: "igual" };
    };

    return (
        <MainLayout title="Progreso">
            <div className="space-y-6">
                {/* Header */}
                <div className="gradient-primary rounded-2xl p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Trophy className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Tu Progreso</h2>
                            <p className="text-white/80">Visualiza tu crecimiento</p>
                        </div>
                    </div>
                </div>

                {/* Achievement stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Racha actual</span>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{stats.currentStreak} días</p>
                        </CardContent>
                    </Card>

                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Trophy className="h-5 w-5 text-purple-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Mejor racha</span>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{stats.bestStreak} días</p>
                        </CardContent>
                    </Card>

                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Horas totales</span>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{stats.totalHours.toFixed(0)}h</p>
                        </CardContent>
                    </Card>

                    <Card hover>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Tareas hechas</span>
                            </div>
                            <p className="text-3xl font-bold text-foreground">{stats.tasksCompleted}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Temporal Comparison */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Mi Progreso vs Antes
                                </CardTitle>
                                <CardDescription>Compara tu rendimiento actual con el pasado</CardDescription>
                            </div>
                            <select
                                value={comparisonMonths}
                                onChange={(e) => setComparisonMonths(Number(e.target.value))}
                                className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm"
                            >
                                <option value={1}>vs hace 1 mes</option>
                                <option value={3}>vs hace 3 meses</option>
                                <option value={6}>vs hace 6 meses</option>
                                <option value={12}>vs hace 12 meses</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {comparison ? (
                            <div className="grid sm:grid-cols-3 gap-4">
                                {/* Hours */}
                                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Horas (último mes)</p>
                                    <p className="text-3xl font-bold text-foreground">{comparison.current.hours.toFixed(0)}h</p>
                                    {(() => {
                                        const diff = comparison.current.hours - comparison.past.hours;
                                        const indicator = getIndicator(comparison.current.hours, comparison.past.hours);
                                        const Icon = indicator.icon;
                                        return (
                                            <p className={`text-sm flex items-center justify-center gap-1 mt-1 ${indicator.color}`}>
                                                <Icon className="h-4 w-4" />
                                                {Math.abs(diff).toFixed(0)}h {indicator.label}
                                            </p>
                                        );
                                    })()}
                                </div>

                                {/* Days Active */}
                                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Días activos</p>
                                    <p className="text-3xl font-bold text-foreground">{comparison.current.days}</p>
                                    {(() => {
                                        const diff = comparison.current.days - comparison.past.days;
                                        const indicator = getIndicator(comparison.current.days, comparison.past.days);
                                        const Icon = indicator.icon;
                                        return (
                                            <p className={`text-sm flex items-center justify-center gap-1 mt-1 ${indicator.color}`}>
                                                <Icon className="h-4 w-4" />
                                                {Math.abs(diff)} {indicator.label}
                                            </p>
                                        );
                                    })()}
                                </div>

                                {/* Average per day */}
                                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">Promedio/día</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {comparison.current.days > 0
                                            ? (comparison.current.hours / comparison.current.days).toFixed(1)
                                            : 0}h
                                    </p>
                                    {(() => {
                                        const currentAvg = comparison.current.days > 0 ? comparison.current.hours / comparison.current.days : 0;
                                        const pastAvg = comparison.past.days > 0 ? comparison.past.hours / comparison.past.days : 0;
                                        const diff = currentAvg - pastAvg;
                                        const indicator = getIndicator(currentAvg, pastAvg);
                                        const Icon = indicator.icon;
                                        return (
                                            <p className={`text-sm flex items-center justify-center gap-1 mt-1 ${indicator.color}`}>
                                                <Icon className="h-4 w-4" />
                                                {Math.abs(diff).toFixed(1)}h {indicator.label}
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Cargando comparación...
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-primary" />
                            Exportar Datos
                        </CardTitle>
                        <CardDescription>Descarga tus registros en formato CSV</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Rango:</span>
                                <select
                                    value={exportRange}
                                    onChange={(e) => setExportRange(e.target.value as "week" | "month" | "year")}
                                    className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm"
                                >
                                    <option value="week">Última semana</option>
                                    <option value="month">Último mes</option>
                                    <option value="year">Último año</option>
                                </select>
                            </div>
                            <button
                                onClick={exportCSV}
                                disabled={isExporting}
                                className="px-4 py-2 rounded-xl gradient-primary text-white font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                {isExporting ? "Exportando..." : "Exportar CSV"}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
