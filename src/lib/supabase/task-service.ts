"use client";

import { supabase } from "./client";
import type { Database } from "./types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type InsertTask = Database["public"]["Tables"]["tasks"]["Insert"];
type UpdateTask = Database["public"]["Tables"]["tasks"]["Update"];

export type { Task, InsertTask, UpdateTask };

// Extended task with subtasks
export interface TaskWithSubtasks extends Task {
    subtasks?: Task[];
}

// ============================================
// TASK CRUD OPERATIONS
// ============================================

export async function getTasks(userId: string): Promise<Task[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .is("parent_id", null) // Only get parent tasks
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }

    return data || [];
}

export async function getTasksWithSubtasks(userId: string): Promise<TaskWithSubtasks[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching tasks:", error);
        return [];
    }

    // Organize into parent-child structure
    const tasksMap = new Map<string, TaskWithSubtasks>();
    const parentTasks: TaskWithSubtasks[] = [];

    // First pass: create map
    data?.forEach(task => {
        tasksMap.set(task.id, { ...task, subtasks: [] });
    });

    // Second pass: organize hierarchy
    data?.forEach(task => {
        const taskWithSubs = tasksMap.get(task.id)!;
        if (task.parent_id) {
            const parent = tasksMap.get(task.parent_id);
            if (parent) {
                parent.subtasks?.push(taskWithSubs);
            }
        } else {
            parentTasks.push(taskWithSubs);
        }
    });

    return parentTasks;
}

export async function getTasksForToday(userId: string): Promise<TaskWithSubtasks[]> {
    if (!supabase) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("due_date", today)
        .neq("status", "completed")
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching today's tasks:", error);
        return [];
    }

    // Organize subtasks
    const tasksMap = new Map<string, TaskWithSubtasks>();
    const parentTasks: TaskWithSubtasks[] = [];

    data?.forEach(task => {
        tasksMap.set(task.id, { ...task, subtasks: [] });
    });

    data?.forEach(task => {
        const taskWithSubs = tasksMap.get(task.id)!;
        if (task.parent_id && tasksMap.has(task.parent_id)) {
            tasksMap.get(task.parent_id)?.subtasks?.push(taskWithSubs);
        } else if (!task.parent_id) {
            parentTasks.push(taskWithSubs);
        }
    });

    return parentTasks;
}

export async function getActiveTasks(userId: string): Promise<TaskWithSubtasks[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .neq("status", "completed")
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching active tasks:", error);
        return [];
    }

    const tasksMap = new Map<string, TaskWithSubtasks>();
    const parentTasks: TaskWithSubtasks[] = [];

    data?.forEach(task => {
        tasksMap.set(task.id, { ...task, subtasks: [] });
    });

    data?.forEach(task => {
        const taskWithSubs = tasksMap.get(task.id)!;
        if (task.parent_id && tasksMap.has(task.parent_id)) {
            tasksMap.get(task.parent_id)?.subtasks?.push(taskWithSubs);
        } else if (!task.parent_id) {
            parentTasks.push(taskWithSubs);
        }
    });

    return parentTasks;
}

export async function getCompletedTasks(userId: string): Promise<Task[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

    if (error) {
        console.error("Error fetching completed tasks:", error);
        return [];
    }

    return data || [];
}

export async function getTasksByCategory(userId: string, categoryId: string): Promise<TaskWithSubtasks[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("category_id", categoryId)
        .neq("status", "completed")
        .order("order_index", { ascending: true });

    if (error) {
        console.error("Error fetching tasks by category:", error);
        return [];
    }

    const tasksMap = new Map<string, TaskWithSubtasks>();
    const parentTasks: TaskWithSubtasks[] = [];

    data?.forEach(task => {
        tasksMap.set(task.id, { ...task, subtasks: [] });
    });

    data?.forEach(task => {
        const taskWithSubs = tasksMap.get(task.id)!;
        if (task.parent_id && tasksMap.has(task.parent_id)) {
            tasksMap.get(task.parent_id)?.subtasks?.push(taskWithSubs);
        } else if (!task.parent_id) {
            parentTasks.push(taskWithSubs);
        }
    });

    return parentTasks;
}

export async function createTask(task: InsertTask): Promise<Task | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

    if (error) {
        console.error("Error creating task:", error);
        return null;
    }

    return data;
}

export async function updateTask(taskId: string, updates: UpdateTask): Promise<Task | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error updating task:", error);
        return null;
    }

    return data;
}

export async function deleteTask(taskId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

    if (error) {
        console.error("Error deleting task:", error);
        return false;
    }

    return true;
}

export async function completeTask(
    taskId: string,
    actualMinutes?: number
): Promise<Task | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("tasks")
        .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            actual_minutes: actualMinutes || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error completing task:", error);
        return null;
    }

    return data;
}

export async function uncompleteTask(taskId: string): Promise<Task | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from("tasks")
        .update({
            status: "pending",
            completed_at: null,
            actual_minutes: null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

    if (error) {
        console.error("Error uncompleting task:", error);
        return null;
    }

    return data;
}

export async function reorderTasks(
    userId: string,
    taskIds: string[]
): Promise<boolean> {
    if (!supabase) return false;

    // Update order_index for each task
    const updates = taskIds.map((id, index) =>
        supabase
            .from("tasks")
            .update({ order_index: index + 1 })
            .eq("id", id)
            .eq("user_id", userId)
    );

    try {
        await Promise.all(updates);
        return true;
    } catch (error) {
        console.error("Error reordering tasks:", error);
        return false;
    }
}

// ============================================
// TASK STATS
// ============================================

export async function getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    todayCompleted: number;
}> {
    if (!supabase) return { total: 0, completed: 0, pending: 0, todayCompleted: 0 };

    const today = new Date().toISOString().split('T')[0];

    // Count all tasks including subtasks
    const { data, error } = await supabase
        .from("tasks")
        .select("id, status, completed_at")
        .eq("user_id", userId);

    if (error) {
        console.error("Error fetching task stats:", error);
        return { total: 0, completed: 0, pending: 0, todayCompleted: 0 };
    }

    const total = data?.length || 0;
    const completed = data?.filter(t => t.status === "completed").length || 0;
    const pending = total - completed;
    const todayCompleted = data?.filter(t =>
        t.completed_at && t.completed_at.startsWith(today)
    ).length || 0;

    return { total, completed, pending, todayCompleted };
}
