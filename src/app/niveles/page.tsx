"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUserId } from "@/lib/supabase/services";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
    Star,
    Trophy,
    Flame,
    Brain,
    CheckCircle,
    Lock,
    Sparkles
} from "lucide-react";

interface Achievement {
    id: string;
    code: string;
    name: string;
    description: string;
    emoji: string;
    xp_reward: number;
    category: string;
}

interface UserAchievement {
    id: string;
    achievement_id: string;
    unlocked_at: string;
}

interface UserXP {
    total_xp: number;
    level: number;
}

// XP required for each level (exponential growth)
function getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

function getTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
        total += getXPForLevel(i);
    }
    return total;
}

function getLevelFromXP(totalXP: number): number {
    let level = 1;
    let xpNeeded = 0;
    while (level < 50 && xpNeeded + getXPForLevel(level) <= totalXP) {
        xpNeeded += getXPForLevel(level);
        level++;
    }
    return level;
}

export default function NivelesPage() {
    const { user } = useAuth();
    const [userXP, setUserXP] = useState<UserXP>({ total_xp: 0, level: 1 });
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Calculate progress
    const currentLevel = getLevelFromXP(userXP.total_xp);
    const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
    const xpForNextLevel = getXPForLevel(currentLevel);
    const currentLevelProgress = userXP.total_xp - xpForCurrentLevel;
    const progressPercent = Math.min(100, (currentLevelProgress / xpForNextLevel) * 100);

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

            // Load user XP
            const { data: xpData } = await supabase
                .from("user_xp")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (xpData) {
                setUserXP({ total_xp: xpData.total_xp, level: xpData.level });
            }

            // Load all achievements
            const { data: allAchievements } = await supabase
                .from("achievements")
                .select("*")
                .order("category", { ascending: true });

            if (allAchievements) {
                setAchievements(allAchievements);
            }

            // Load user's unlocked achievements
            const { data: userAchievements } = await supabase
                .from("user_achievements")
                .select("*")
                .eq("user_id", userId);

            if (userAchievements) {
                setUnlockedAchievements(new Set(userAchievements.map(ua => ua.achievement_id)));
            }

            setIsLoading(false);
        }

        loadData();
    }, [user]);

    // Group achievements by category
    const achievementsByCategory = achievements.reduce((acc, achievement) => {
        const cat = achievement.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>);

    const categoryLabels: Record<string, { label: string; emoji: string }> = {
        milestones: { label: "Hitos", emoji: "🎯" },
        streaks: { label: "Rachas", emoji: "🔥" },
        productivity: { label: "Productividad", emoji: "🧠" },
        habits: { label: "Hábitos", emoji: "✨" },
    };

    const unlockedCount = unlockedAchievements.size;
    const totalCount = achievements.length;

    return (
        <MainLayout title="Niveles">
            <div className="space-y-6">
                {/* Level Progress Card */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-white">{currentLevel}</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Nivel {currentLevel}</h2>
                                    <p className="text-white/70">
                                        {userXP.total_xp.toLocaleString()} XP total
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-white/70 text-sm">Próximo nivel</p>
                                <p className="text-xl font-bold text-white">
                                    {Math.max(0, xpForNextLevel - currentLevelProgress)} XP
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-white/70">
                                <span>Nivel {currentLevel}</span>
                                <span>Nivel {currentLevel + 1}</span>
                            </div>
                            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="text-center text-white/70 text-sm">
                                {currentLevelProgress} / {xpForNextLevel} XP
                            </p>
                        </div>
                    </div>
                </Card>

                {/* XP Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Cómo ganar XP
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                                <Brain className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">10 XP</p>
                                <p className="text-sm text-muted-foreground">Por hora de Deep Work</p>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">50 XP</p>
                                <p className="text-sm text-muted-foreground">Por tarea completada</p>
                            </div>
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
                                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">200 XP</p>
                                <p className="text-sm text-muted-foreground">Por día perfecto</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Achievements Summary */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    Logros
                                </CardTitle>
                                <CardDescription>
                                    {unlockedCount} de {totalCount} desbloqueados
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-foreground">{unlockedCount}/{totalCount}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                                style={{ width: `${(unlockedCount / Math.max(1, totalCount)) * 100}%` }}
                            />
                        </div>
                    </CardHeader>
                </Card>

                {/* Achievements by Category */}
                {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-xl">{categoryLabels[category]?.emoji || "🏆"}</span>
                                {categoryLabels[category]?.label || category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryAchievements.map(achievement => {
                                    const isUnlocked = unlockedAchievements.has(achievement.id);

                                    return (
                                        <div
                                            key={achievement.id}
                                            className={`p-4 rounded-xl border transition-all ${isUnlocked
                                                ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
                                                : "bg-secondary/50 border-border opacity-60"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className={`text-3xl ${!isUnlocked && "grayscale"}`}>
                                                    {achievement.emoji}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                                                            {achievement.name}
                                                        </p>
                                                        {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {achievement.description}
                                                    </p>
                                                    <p className={`text-xs mt-2 font-medium ${isUnlocked ? "text-yellow-500" : "text-muted-foreground"}`}>
                                                        +{achievement.xp_reward} XP
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty state if no achievements */}
                {achievements.length === 0 && !isLoading && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                Sistema de logros próximamente
                            </h3>
                            <p className="text-muted-foreground">
                                Ejecuta el script SQL para habilitar los logros
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
