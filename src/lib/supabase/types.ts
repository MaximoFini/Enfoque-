export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            categories: {
                Row: {
                    id: string;
                    name: string;
                    emoji: string;
                    color: string | null;
                    parent_id: string | null;
                    user_id: string | null;
                    is_system: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    emoji: string;
                    color?: string | null;
                    parent_id?: string | null;
                    user_id?: string | null;
                    is_system?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    emoji?: string;
                    color?: string | null;
                    parent_id?: string | null;
                    user_id?: string | null;
                    is_system?: boolean;
                    created_at?: string;
                };
            };
            tasks: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    status: "pending" | "in_progress" | "completed";
                    priority: "low" | "medium" | "high";
                    due_date: string | null;
                    category_id: string | null;
                    user_id: string;
                    estimated_minutes: number | null;
                    actual_minutes: number | null;
                    completed_at: string | null;
                    order_index: number;
                    parent_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    description?: string | null;
                    status?: "pending" | "in_progress" | "completed";
                    priority?: "low" | "medium" | "high";
                    due_date?: string | null;
                    category_id?: string | null;
                    user_id: string;
                    estimated_minutes?: number | null;
                    actual_minutes?: number | null;
                    completed_at?: string | null;
                    order_index?: number;
                    parent_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    description?: string | null;
                    status?: "pending" | "in_progress" | "completed";
                    priority?: "low" | "medium" | "high";
                    due_date?: string | null;
                    category_id?: string | null;
                    user_id?: string;
                    estimated_minutes?: number | null;
                    actual_minutes?: number | null;
                    completed_at?: string | null;
                    order_index?: number;
                    parent_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            time_blocks: {
                Row: {
                    id: string;
                    title: string;
                    start_time: string;
                    end_time: string;
                    date: string;
                    category_id: string | null;
                    user_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    start_time: string;
                    end_time: string;
                    date: string;
                    category_id?: string | null;
                    user_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    start_time?: string;
                    end_time?: string;
                    date?: string;
                    category_id?: string | null;
                    user_id?: string;
                    created_at?: string;
                };
            };
            time_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    category_id: string | null;
                    subcategory_id: string | null;
                    duration_minutes: number;
                    work_type: "deep" | "shallow";
                    started_at: string;
                    ended_at: string;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    category_id?: string | null;
                    subcategory_id?: string | null;
                    duration_minutes: number;
                    work_type: "deep" | "shallow";
                    started_at: string;
                    ended_at: string;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    category_id?: string | null;
                    subcategory_id?: string | null;
                    duration_minutes?: number;
                    work_type?: "deep" | "shallow";
                    started_at?: string;
                    ended_at?: string;
                    notes?: string | null;
                    created_at?: string;
                };
            };
            weekly_goals: {
                Row: {
                    id: string;
                    user_id: string;
                    category_id: string;
                    target_hours: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    category_id: string;
                    target_hours: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    category_id?: string;
                    target_hours?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            task_status: "pending" | "in_progress" | "completed";
            task_priority: "low" | "medium" | "high";
            work_type: "deep" | "shallow";
        };
    };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TimeBlock = Database["public"]["Tables"]["time_blocks"]["Row"];
export type TimeLog = Database["public"]["Tables"]["time_logs"]["Row"];

export type InsertProfile = Database["public"]["Tables"]["profiles"]["Insert"];
export type InsertCategory = Database["public"]["Tables"]["categories"]["Insert"];
export type InsertTask = Database["public"]["Tables"]["tasks"]["Insert"];
export type InsertTimeBlock = Database["public"]["Tables"]["time_blocks"]["Insert"];
export type InsertTimeLog = Database["public"]["Tables"]["time_logs"]["Insert"];
export type WeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Row"];
export type InsertWeeklyGoal = Database["public"]["Tables"]["weekly_goals"]["Insert"];

export type WorkType = "deep" | "shallow";

export interface DailyLog {
    id: string;
    user_id: string;
    log_date: string;
    energy_level: number;
    what_worked: string | null;
    needs_improvement: string | null;
    social_media_minutes: number;
    phone_usage_minutes: number;
    sleep_hours: number | null;
    sleep_quality: number | null;
    stress_level: number | null;
    mood: string | null;
    notes: string | null;
    created_at: string;
}

export interface WeeklyRetrospective {
    id: string;
    user_id: string;
    week_start: string;
    week_end: string;
    total_hours: number;
    deep_work_hours: number;
    shallow_work_hours: number;
    sessions_count: number;
    accomplishments: string | null;
    challenges: string | null;
    learnings: string | null;
    next_week_focus: string | null;
    rating: number;
    created_at: string;
}
