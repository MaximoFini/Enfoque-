"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUserId } from "@/lib/supabase/services";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
    Calendar,
    Moon,
    Zap,
    Target,
    AlertCircle,
    ChevronRight,
    CheckCircle,
    X,
    Smartphone
} from "lucide-react";

interface DailyLog {
    id: string;
    log_date: string;
    energy_level: number;
    what_worked: string | null;
    what_to_improve: string | null;
    social_media_minutes: number;
    sleep_quality: number | null;
}

interface WeeklyRetrospective {
    id: string;
    week_start: string;
    total_hours: number;
    deep_hours: number;
    shallow_hours: number;
    tasks_completed: number;
    most_productive_day: string | null;
    top_category: string | null;
    wins: string | null;
    challenges: string | null;
    learnings: string | null;
    next_week_focus: string | null;
    rating: number | null;
}

// Energy emojis for selection
const ENERGY_EMOJIS = ["😴", "😕", "😐", "🙂", "😊"];

export default function RetrospectivaPage() {
    const { user } = useAuth();
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [showWeeklyModal, setShowWeeklyModal] = useState(false);
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [weeklyRetros, setWeeklyRetros] = useState<WeeklyRetrospective[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Check if we should show popup based on time
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday
    const todayStr = now.toISOString().split('T')[0];

    // Get current week's Monday
    const monday = new Date(now);
    const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
    monday.setDate(diff);
    const weekStartStr = monday.toISOString().split('T')[0];

    // Form state for daily log
    const [dailyForm, setDailyForm] = useState({
        energy_level: 3,
        what_worked: "",
        what_to_improve: "",
        social_media_hours: 0,
        social_media_minutes: 0,
        sleep_quality: 7,
    });

    // Form state for weekly retro
    const [weeklyForm, setWeeklyForm] = useState({
        wins: "",
        challenges: "",
        learnings: "",
        next_week_focus: "",
        rating: 7,
    });

    // Load data
    useEffect(() => {
        async function loadData() {
            const userId = await getCurrentUserId();
            if (!userId) {
                setIsLoading(false);
                return;
            }

            const supabase = getSupabaseClient();
            if (!supabase) {
                setIsLoading(false);
                return;
            }

            // Load recent daily logs
            const { data: logs } = await supabase
                .from("daily_logs")
                .select("*")
                .eq("user_id", userId)
                .order("log_date", { ascending: false })
                .limit(30);

            if (logs) setDailyLogs(logs);

            // Load recent weekly retros
            const { data: retros } = await supabase
                .from("weekly_retrospectives")
                .select("*")
                .eq("user_id", userId)
                .order("week_start", { ascending: false })
                .limit(12);

            if (retros) setWeeklyRetros(retros);

            setIsLoading(false);

            // Check if should show popups
            const todayLog = logs?.find(l => l.log_date === todayStr);
            const thisWeekRetro = retros?.find(r => r.week_start === weekStartStr);

            // Show daily popup if after 22:00 and not logged today
            if (currentHour >= 22 && !todayLog) {
                setShowDailyModal(true);
            }

            // Show weekly popup if Sunday after 17:00 and not logged this week
            if (currentDay === 0 && currentHour >= 17 && !thisWeekRetro) {
                setShowWeeklyModal(true);
            }
        }

        loadData();
    }, [user, todayStr, weekStartStr, currentHour, currentDay]);

    // Save daily log
    const saveDailyLog = async () => {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        const totalSocialMinutes = dailyForm.social_media_hours * 60 + dailyForm.social_media_minutes;

        await supabase.from("daily_logs").upsert({
            user_id: userId,
            log_date: todayStr,
            energy_level: dailyForm.energy_level,
            what_worked: dailyForm.what_worked || null,
            what_to_improve: dailyForm.what_to_improve || null,
            social_media_minutes: totalSocialMinutes,
            sleep_quality: dailyForm.sleep_quality,
        });

        setShowDailyModal(false);

        // Reload data
        const { data: logs } = await supabase
            .from("daily_logs")
            .select("*")
            .eq("user_id", userId)
            .order("log_date", { ascending: false })
            .limit(30);
        if (logs) setDailyLogs(logs);
    };

    // Save weekly retro
    const saveWeeklyRetro = async () => {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Calculate auto-fill fields from time_logs
        const weekEnd = new Date(monday);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const { data: logs } = await supabase
            .from("time_logs")
            .select("*")
            .eq("user_id", userId)
            .gte("started_at", monday.toISOString())
            .lte("started_at", weekEnd.toISOString());

        let totalHours = 0;
        let deepHours = 0;
        let shallowHours = 0;

        if (logs) {
            totalHours = logs.reduce((sum, l) => sum + l.duration_minutes, 0) / 60;
            deepHours = logs.filter(l => l.work_type === "deep").reduce((sum, l) => sum + l.duration_minutes, 0) / 60;
            shallowHours = logs.filter(l => l.work_type === "shallow").reduce((sum, l) => sum + l.duration_minutes, 0) / 60;
        }

        await supabase.from("weekly_retrospectives").upsert({
            user_id: userId,
            week_start: weekStartStr,
            total_hours: totalHours,
            deep_hours: deepHours,
            shallow_hours: shallowHours,
            tasks_completed: 0, // TODO: count from tasks
            wins: weeklyForm.wins || null,
            challenges: weeklyForm.challenges || null,
            learnings: weeklyForm.learnings || null,
            next_week_focus: weeklyForm.next_week_focus || null,
            rating: weeklyForm.rating,
        });

        setShowWeeklyModal(false);

        // Reload data
        const { data: retros } = await supabase
            .from("weekly_retrospectives")
            .select("*")
            .eq("user_id", userId)
            .order("week_start", { ascending: false })
            .limit(12);
        if (retros) setWeeklyRetros(retros);
    };

    // Check if today is logged
    const todayLogged = dailyLogs.some(l => l.log_date === todayStr);
    const thisWeekLogged = weeklyRetros.some(r => r.week_start === weekStartStr);

    return (
        <MainLayout title="Retrospectiva">
            <div className="space-y-6">
                {/* Reminder banners */}
                {currentHour >= 22 && !todayLogged && (
                    <Card className="border-yellow-500/50 bg-yellow-500/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-yellow-500" />
                                <div>
                                    <p className="font-medium text-foreground">📝 Daily Log pendiente</p>
                                    <p className="text-sm text-muted-foreground">Registra cómo fue tu día antes de dormir</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDailyModal(true)}
                                className="px-4 py-2 rounded-xl gradient-primary text-white font-medium"
                            >
                                Completar
                            </button>
                        </CardContent>
                    </Card>
                )}

                {currentDay === 0 && currentHour >= 17 && !thisWeekLogged && (
                    <Card className="border-purple-500/50 bg-purple-500/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-6 w-6 text-purple-500" />
                                <div>
                                    <p className="font-medium text-foreground">🗓️ Retrospectiva Semanal pendiente</p>
                                    <p className="text-sm text-muted-foreground">Reflexiona sobre tu semana</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowWeeklyModal(true)}
                                className="px-4 py-2 rounded-xl gradient-primary text-white font-medium"
                            >
                                Completar
                            </button>
                        </CardContent>
                    </Card>
                )}

                {/* Quick actions */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => setShowDailyModal(true)}
                        className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 hover:border-orange-500/50 transition-all text-left"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Moon className="h-8 w-8 text-orange-400" />
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Daily Log</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {todayLogged ? "✅ Completado hoy" : "Registra cómo fue tu día"}
                        </p>
                    </button>

                    <button
                        onClick={() => setShowWeeklyModal(true)}
                        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all text-left"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <Calendar className="h-8 w-8 text-purple-400" />
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Retrospectiva Semanal</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {thisWeekLogged ? "✅ Completada esta semana" : "Reflexiona sobre tu semana"}
                        </p>
                    </button>
                </div>

                {/* Recent Daily Logs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5 text-orange-400" />
                            Daily Logs Recientes
                        </CardTitle>
                        <CardDescription>Historial de tus registros diarios</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dailyLogs.length > 0 ? (
                            <div className="space-y-3">
                                {dailyLogs.slice(0, 7).map(log => (
                                    <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                                        <span className="text-2xl">{ENERGY_EMOJIS[log.energy_level - 1]}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-foreground">
                                                {new Date(log.log_date).toLocaleDateString("es-ES", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "short"
                                                })}
                                            </p>
                                            {log.what_worked && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    ✅ {log.what_worked}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-muted-foreground">
                                                📱 {Math.floor(log.social_media_minutes / 60)}h {log.social_media_minutes % 60}m
                                            </p>
                                            {log.sleep_quality && (
                                                <p className="text-muted-foreground">
                                                    😴 {log.sleep_quality}/10
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay registros diarios aún
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Weekly Retros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-400" />
                            Retrospectivas Semanales
                        </CardTitle>
                        <CardDescription>Historial de tus reflexiones semanales</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {weeklyRetros.length > 0 ? (
                            <div className="space-y-3">
                                {weeklyRetros.map(retro => (
                                    <div key={retro.id} className="p-4 rounded-xl bg-secondary/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-foreground">
                                                Semana del {new Date(retro.week_start).toLocaleDateString("es-ES", {
                                                    day: "numeric",
                                                    month: "short"
                                                })}
                                            </p>
                                            {retro.rating && (
                                                <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-sm font-bold">
                                                    {retro.rating}/10
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                                            <div>
                                                <p className="font-bold text-foreground">{retro.total_hours?.toFixed(1)}h</p>
                                                <p className="text-muted-foreground">Total</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-purple-400">{retro.deep_hours?.toFixed(1)}h</p>
                                                <p className="text-muted-foreground">Deep</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-yellow-400">{retro.shallow_hours?.toFixed(1)}h</p>
                                                <p className="text-muted-foreground">Shallow</p>
                                            </div>
                                        </div>
                                        {retro.wins && (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                🏆 {retro.wins}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay retrospectivas semanales aún
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Log Modal */}
            {showDailyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDailyModal(false)} />
                    <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">📝 Daily Log</h3>
                            <button onClick={() => setShowDailyModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-4 space-y-5">
                            {/* Energy Level */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    ¿Cómo estuvo tu energía hoy?
                                </label>
                                <div className="flex justify-between gap-2">
                                    {ENERGY_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setDailyForm(f => ({ ...f, energy_level: i + 1 }))}
                                            className={`flex-1 py-3 rounded-xl text-2xl transition-all ${dailyForm.energy_level === i + 1
                                                ? "bg-primary/20 ring-2 ring-primary scale-110"
                                                : "bg-secondary hover:bg-secondary/80"
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* What worked */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    ✅ ¿Qué funcionó bien?
                                </label>
                                <textarea
                                    value={dailyForm.what_worked}
                                    onChange={(e) => setDailyForm(f => ({ ...f, what_worked: e.target.value }))}
                                    placeholder="Lo que salió bien hoy..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* What to improve */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    🎯 ¿Qué mejorar mañana?
                                </label>
                                <textarea
                                    value={dailyForm.what_to_improve}
                                    onChange={(e) => setDailyForm(f => ({ ...f, what_to_improve: e.target.value }))}
                                    placeholder="Áreas de mejora..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* Social media time */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    Tiempo en redes sociales
                                </label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <select
                                            value={dailyForm.social_media_hours}
                                            onChange={(e) => setDailyForm(f => ({ ...f, social_media_hours: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                                        >
                                            {Array.from({ length: 13 }, (_, i) => (
                                                <option key={i} value={i}>{i}h</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <select
                                            value={dailyForm.social_media_minutes}
                                            onChange={(e) => setDailyForm(f => ({ ...f, social_media_minutes: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                                        >
                                            {[0, 15, 30, 45].map(m => (
                                                <option key={m} value={m}>{m}m</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sleep quality */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    😴 Calidad de sueño (anoche): {dailyForm.sleep_quality}/10
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={dailyForm.sleep_quality}
                                    onChange={(e) => setDailyForm(f => ({ ...f, sleep_quality: Number(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Mal</span>
                                    <span>Excelente</span>
                                </div>
                            </div>

                            <button
                                onClick={saveDailyLog}
                                className="w-full py-3 rounded-xl gradient-primary text-white font-medium"
                            >
                                Guardar Daily Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Retro Modal */}
            {showWeeklyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWeeklyModal(false)} />
                    <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">🗓️ Retrospectiva Semanal</h3>
                            <button onClick={() => setShowWeeklyModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-4 space-y-5">
                            {/* Wins */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    🏆 ¿Qué logros tuviste esta semana?
                                </label>
                                <textarea
                                    value={weeklyForm.wins}
                                    onChange={(e) => setWeeklyForm(f => ({ ...f, wins: e.target.value }))}
                                    placeholder="Tus victorias de la semana..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* Challenges */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    💪 ¿Qué desafíos enfrentaste?
                                </label>
                                <textarea
                                    value={weeklyForm.challenges}
                                    onChange={(e) => setWeeklyForm(f => ({ ...f, challenges: e.target.value }))}
                                    placeholder="Los obstáculos de la semana..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* Learnings */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    💡 ¿Qué aprendiste?
                                </label>
                                <textarea
                                    value={weeklyForm.learnings}
                                    onChange={(e) => setWeeklyForm(f => ({ ...f, learnings: e.target.value }))}
                                    placeholder="Aprendizajes clave..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* Next week focus */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    🎯 Foco para la próxima semana
                                </label>
                                <textarea
                                    value={weeklyForm.next_week_focus}
                                    onChange={(e) => setWeeklyForm(f => ({ ...f, next_week_focus: e.target.value }))}
                                    placeholder="¿En qué te vas a enfocar?"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground resize-none"
                                />
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    ⭐ Puntuación de la semana: {weeklyForm.rating}/10
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={weeklyForm.rating}
                                    onChange={(e) => setWeeklyForm(f => ({ ...f, rating: Number(e.target.value) }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Mala</span>
                                    <span>Excelente</span>
                                </div>
                            </div>

                            <button
                                onClick={saveWeeklyRetro}
                                className="w-full py-3 rounded-xl gradient-primary text-white font-medium"
                            >
                                Guardar Retrospectiva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
