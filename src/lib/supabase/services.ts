"use client";

import { supabase, isSupabaseConfigured } from "./client";
import type { WeeklyGoal, InsertWeeklyGoal, TimeLog, Category, DailyLog } from "./types";

// ============================================
// WEEKLY GOALS SERVICE
// ============================================

export async function getWeeklyGoals(userId: string): Promise<WeeklyGoal[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("weekly_goals")
        .select("*")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching weekly goals:", error);
        return [];
    }

    return data || [];
}

export async function upsertWeeklyGoal(
    userId: string,
    categoryId: string,
    targetHours: number
): Promise<WeeklyGoal | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("weekly_goals")
        .upsert(
            {
                user_id: userId,
                category_id: categoryId,
                target_hours: targetHours,
            },
            {
                onConflict: "user_id,category_id",
            }
        )
        .select()
        .single();

    if (error) {
        console.error("Error upserting weekly goal:", error);
        return null;
    }

    return data;
}

export async function deleteWeeklyGoal(
    userId: string,
    categoryId: string
): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from("weekly_goals")
        .delete()
        .eq("user_id", userId)
        .eq("category_id", categoryId);

    if (error) {
        console.error("Error deleting weekly goal:", error);
        return false;
    }

    return true;
}

// ============================================
// TIME LOGS SERVICE
// ============================================

export async function createTimeLog(log: {
    userId: string;
    categoryId?: string;
    subcategoryId?: string;
    durationMinutes: number;
    workType: "deep" | "shallow";
    startedAt: Date;
    endedAt: Date;
    notes?: string;
}): Promise<TimeLog | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("time_logs")
        .insert({
            user_id: log.userId,
            category_id: log.categoryId || null,
            subcategory_id: log.subcategoryId || null,
            duration_minutes: log.durationMinutes,
            work_type: log.workType,
            started_at: log.startedAt.toISOString(),
            ended_at: log.endedAt.toISOString(),
            notes: log.notes || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating time log:", error);
        return null;
    }

    return data;
}

// Extended version that supports "other" work type
// Stores metadata in notes field to track original work type and color
export async function createTimeLogExtended(log: {
    userId: string;
    title: string;
    categoryId?: string;
    durationMinutes: number;
    workType: "deep" | "shallow" | "other";
    color?: string;
    startedAt: Date;
    endedAt: Date;
}): Promise<TimeLog | null> {
    if (!supabase) return null;

    // For "other" work type, store metadata in notes field
    // We still need to use "shallow" for the DB constraint, but mark it as "other"
    const isOther = log.workType === "other";
    const dbWorkType = isOther ? "shallow" : log.workType;

    // Build notes with metadata
    const metadata = isOther ? {
        __type: "other",
        title: log.title,
        color: log.color || "#22c55e"
    } : null;

    const notesValue = metadata ? `__OTHER__${JSON.stringify(metadata)}` : log.title;

    const { data, error } = await supabase
        .from("time_logs")
        .insert({
            user_id: log.userId,
            category_id: log.categoryId || null,
            subcategory_id: null,
            duration_minutes: log.durationMinutes,
            work_type: dbWorkType,
            started_at: log.startedAt.toISOString(),
            ended_at: log.endedAt.toISOString(),
            notes: notesValue,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating extended time log:", error);
        return null;
    }

    return data;
}

// Helper to check if a time log is "other" type
export function isOtherWorkType(notes: string | null): boolean {
    return notes?.startsWith("__OTHER__") || false;
}

// Helper to parse "other" metadata from notes
export function parseOtherMetadata(notes: string | null): { title: string; color: string } | null {
    if (!notes?.startsWith("__OTHER__")) return null;
    try {
        return JSON.parse(notes.replace("__OTHER__", ""));
    } catch {
        return null;
    }
}

export async function updateTimeLogDuration(
    logId: string,
    durationMinutes: number
): Promise<boolean> {
    if (!supabase) return false;

    // First get the started_at to calculate new ended_at
    const { data: log, error: fetchError } = await supabase
        .from("time_logs")
        .select("started_at")
        .eq("id", logId)
        .single();

    if (fetchError || !log) return false;

    const startedAt = new Date(log.started_at);
    // Add duration in milliseconds
    const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);

    const { error } = await supabase
        .from("time_logs")
        .update({
            duration_minutes: durationMinutes,
            ended_at: endedAt.toISOString(),
        })
        .eq("id", logId);

    if (error) {
        console.error("Error updating time log:", error);
        return false;
    }

    return true;
}

export async function getTimeLogsForWeek(
    userId: string,
    weekStart: Date,
    weekEnd: Date
): Promise<TimeLog[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("started_at", weekStart.toISOString())
        .lte("started_at", weekEnd.toISOString())
        .order("started_at", { ascending: false });

    if (error) {
        console.error("Error fetching time logs:", error);
        return [];
    }

    return data || [];
}

export async function getTimeLogsForToday(userId: string): Promise<TimeLog[]> {
    if (!supabase) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("started_at", today.toISOString())
        .lt("started_at", tomorrow.toISOString())
        .order("started_at", { ascending: false });

    if (error) {
        console.error("Error fetching today's time logs:", error);
        return [];
    }

    return data || [];
}

// ============================================
// CATEGORIES SERVICE
// ============================================

export async function getCategories(): Promise<Category[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }

    return data || [];
}

export async function getSystemCategories(): Promise<Category[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_system", true)
        .is("parent_id", null)
        .order("name");

    if (error) {
        console.error("Error fetching system categories:", error);
        return [];
    }

    return data || [];
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", parentId)
        .order("name");

    if (error) {
        console.error("Error fetching subcategories:", error);
        return [];
    }

    return data || [];
}

// ============================================
// AUTH HELPER
// ============================================

export async function getCurrentUserId(): Promise<string | null> {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// ============================================
// DAILY LOGS SERVICE
// ============================================

export async function getDailyLogsForWeek(
    userId: string,
    weekStart: Date,
    weekEnd: Date
): Promise<DailyLog[]> {
    if (!supabase) return [];

    // Format dates as YYYY-MM-DD
    const isoStart = weekStart.toISOString().split('T')[0];
    const isoEnd = weekEnd.toISOString().split('T')[0];

    // Supabase needs to select all fields to match DailyLog interface
    // but the types are inferred if we cast or let TS infer from schema
    // Since DailyLog is manually defined in types.ts (not from database.types yet),
    // we just return whatever we get, assuming the query matches the table.

    const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", isoStart)
        .lte("log_date", isoEnd);

    if (error) {
        console.error("Error fetching daily logs:", error);
        return [];
    }

    return (data || []) as DailyLog[];
}

// ============================================
// CONFIG HELPER
// ============================================

export { isSupabaseConfigured };
