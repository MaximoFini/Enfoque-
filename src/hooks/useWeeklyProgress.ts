"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES, getCategoryById } from "@/lib/data/categories";
import {
    getWeeklyGoals,
    getDailyLogsForWeek,
    getTimeLogsForToday,
    getCurrentUserId,
    getCategories as getSupabaseCategories,
} from "@/lib/supabase/services";
import type { Category } from "@/lib/supabase/types";

export interface WeeklyProgressData {
    categoryId: string;
    categoryName: string;
    emoji: string;
    color: string;
    targetHours: number;
    currentHours: number;
    deepHours: number;
    shallowHours: number;
}

export interface TodayProgressData {
    categoryId: string;
    categoryName: string;
    emoji: string;
    color: string;
    totalMinutes: number;
    deepMinutes: number;
    shallowMinutes: number;
}

interface UseWeeklyProgressReturn {
    weeklyProgress: WeeklyProgressData[];
    todayProgress: TodayProgressData[];
    daysRemaining: number;
    totalWeeklyHours: number;
    totalWeeklyTarget: number;
    totalTodayHours: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

// Get start of current week (Monday)
function getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

// Get end of current week (Sunday)
function getWeekEnd(): Date {
    const weekStart = getWeekStart();
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
}

// Get days remaining in week (including today)
function getDaysRemaining(): number {
    const now = new Date();
    const dayOfWeek = now.getDay();
    return dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1;
}

// Default mock goals for when user is not authenticated
const DEFAULT_GOALS = [
    { categoryId: "facultad", targetHours: 28 },
    { categoryId: "kei", targetHours: 15 },
    { categoryId: "gym", targetHours: 6 },
];

export function useWeeklyProgress(): UseWeeklyProgressReturn {
    const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressData[]>([]);
    const [todayProgress, setTodayProgress] = useState<TodayProgressData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const daysRemaining = getDaysRemaining();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const userId = await getCurrentUserId();

            if (userId) {
                // User is authenticated - fetch from Supabase
                const weekStart = getWeekStart();
                const weekEnd = getWeekEnd();

                const [goalsData, weekLogs, todayLogs, supabaseCategories] = await Promise.all([
                    getWeeklyGoals(userId),
                    getTimeLogsForWeek(userId, weekStart, weekEnd),
                    getTimeLogsForToday(userId),
                    getSupabaseCategories(),
                ]);

                // Try to fetch daily logs separately to avoid crashing if table doesn't exist
                let dailyLogsWeek: any[] = [];
                try {
                    dailyLogsWeek = await getDailyLogsForWeek(userId, weekStart, weekEnd);
                } catch (e) {
                    console.warn("Could not fetch daily logs (table might be missing):", e);
                }

                // Calculate total social media minutes for the week
                const totalSocialMediaHours = (dailyLogsWeek || []).reduce((sum, log) => sum + (log.social_media_minutes || 0), 0) / 60;

                // Create a map for quick category lookup by UUID
                const categoryMap = new Map<string, Category>();
                supabaseCategories.forEach(cat => categoryMap.set(cat.id, cat));

                // Calculate weekly progress
                const weekly: WeeklyProgressData[] = goalsData.map(goal => {
                    // First try to find in Supabase categories (UUID), then in local categories
                    const supabaseCat = categoryMap.get(goal.category_id);
                    const localCategory = getCategoryById(goal.category_id);

                    const categoryName = supabaseCat?.name || localCategory?.name || "Sin nombre";
                    const emoji = supabaseCat?.emoji || localCategory?.emoji || "📁";
                    const color = supabaseCat?.color || localCategory?.color || "#6366f1";

                    const categoryLogs = weekLogs.filter(l => l.category_id === goal.category_id);

                    const deepMinutes = categoryLogs
                        .filter(l => l.work_type === "deep")
                        .reduce((sum, l) => sum + l.duration_minutes, 0);

                    const shallowMinutes = categoryLogs
                        .filter(l => l.work_type === "shallow")
                        .reduce((sum, l) => sum + l.duration_minutes, 0);

                    // Check if this category is related to "Scroll" or "Social Media"
                    const isScrollCategory = categoryName.toLowerCase().includes("scroll") ||
                        categoryName.toLowerCase().includes("redes") ||
                        categoryName.toLowerCase().includes("social");

                    // For Scroll category, override current progress with data from daily logs
                    if (isScrollCategory) {
                        return {
                            categoryId: goal.category_id,
                            categoryName,
                            emoji,
                            color,
                            targetHours: Number(goal.target_hours),
                            currentHours: totalSocialMediaHours,
                            deepHours: 0,
                            shallowHours: totalSocialMediaHours,
                        };
                    }

                    return {
                        categoryId: goal.category_id,
                        categoryName,
                        emoji,
                        color,
                        targetHours: Number(goal.target_hours),
                        currentHours: (deepMinutes + shallowMinutes) / 60,
                        deepHours: deepMinutes / 60,
                        shallowHours: shallowMinutes / 60,
                    };
                });

                // Calculate today's progress
                const todayByCategory = new Map<string, { deep: number; shallow: number }>();

                todayLogs.forEach(log => {
                    const current = todayByCategory.get(log.category_id || "") || { deep: 0, shallow: 0 };
                    if (log.work_type === "deep") {
                        current.deep += log.duration_minutes;
                    } else {
                        current.shallow += log.duration_minutes;
                    }
                    todayByCategory.set(log.category_id || "", current);
                });

                const today: TodayProgressData[] = Array.from(todayByCategory.entries()).map(([categoryId, data]) => {
                    const supabaseCat = categoryMap.get(categoryId);
                    const localCategory = getCategoryById(categoryId);

                    return {
                        categoryId,
                        categoryName: supabaseCat?.name || localCategory?.name || "Sin nombre",
                        emoji: supabaseCat?.emoji || localCategory?.emoji || "📁",
                        color: supabaseCat?.color || localCategory?.color || "#6366f1",
                        totalMinutes: data.deep + data.shallow,
                        deepMinutes: data.deep,
                        shallowMinutes: data.shallow,
                    };
                });

                setWeeklyProgress(weekly);
                setTodayProgress(today);
            } else {
                // User not authenticated - use default mock data
                const weekly: WeeklyProgressData[] = DEFAULT_GOALS.map(goal => {
                    const category = getCategoryById(goal.categoryId);
                    return {
                        categoryId: goal.categoryId,
                        categoryName: category?.name || goal.categoryId,
                        emoji: category?.emoji || "📁",
                        color: category?.color || "#6366f1",
                        targetHours: goal.targetHours,
                        currentHours: 0,
                        deepHours: 0,
                        shallowHours: 0,
                    };
                });

                setWeeklyProgress(weekly);
                setTodayProgress([]);
            }
        } catch (err) {
            console.error("Error fetching weekly progress:", err);
            setError("Error al cargar el progreso");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const refresh = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const totalWeeklyHours = weeklyProgress.reduce((sum, p) => sum + p.currentHours, 0);
    const totalWeeklyTarget = weeklyProgress.reduce((sum, p) => sum + p.targetHours, 0);
    const totalTodayHours = todayProgress.reduce((sum, p) => sum + p.totalMinutes, 0) / 60;

    return {
        weeklyProgress,
        todayProgress,
        daysRemaining,
        totalWeeklyHours,
        totalWeeklyTarget,
        totalTodayHours,
        isLoading,
        error,
        refresh,
    };
}
