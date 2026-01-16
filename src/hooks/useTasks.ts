"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getTasksWithSubtasks,
    getTasksForToday,
    getActiveTasks,
    getCompletedTasks,
    getTasksByCategory,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    reorderTasks,
    getTaskStats,
    type TaskWithSubtasks,
    type Task,
    type InsertTask,
    type UpdateTask,
} from "@/lib/supabase/task-service";

export type TaskView = "today" | "all" | "completed" | "category";

interface UseTasksOptions {
    view?: TaskView;
    categoryId?: string;
}

interface UseTasksReturn {
    tasks: TaskWithSubtasks[];
    stats: {
        total: number;
        completed: number;
        pending: number;
        todayCompleted: number;
    };
    isLoading: boolean;
    error: string | null;
    // Actions
    addTask: (task: Omit<InsertTask, "user_id">) => Promise<Task | null>;
    editTask: (taskId: string, updates: UpdateTask) => Promise<Task | null>;
    removeTask: (taskId: string) => Promise<boolean>;
    complete: (taskId: string, actualMinutes?: number) => Promise<Task | null>;
    uncomplete: (taskId: string) => Promise<Task | null>;
    reorder: (taskIds: string[]) => Promise<boolean>;
    refresh: () => void;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
    const { view = "all", categoryId } = options;
    const { user } = useAuth();

    const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, todayCompleted: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTasks = useCallback(async () => {
        if (!user) {
            setTasks([]);
            setStats({ total: 0, completed: 0, pending: 0, todayCompleted: 0 });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let fetchedTasks: TaskWithSubtasks[] = [];

            switch (view) {
                case "today":
                    fetchedTasks = await getTasksForToday(user.id);
                    break;
                case "completed":
                    fetchedTasks = await getCompletedTasks(user.id) as TaskWithSubtasks[];
                    break;
                case "category":
                    if (categoryId) {
                        fetchedTasks = await getTasksByCategory(user.id, categoryId);
                    } else {
                        fetchedTasks = await getActiveTasks(user.id);
                    }
                    break;
                case "all":
                default:
                    fetchedTasks = await getActiveTasks(user.id);
                    break;
            }

            setTasks(fetchedTasks);

            // Also fetch stats
            const taskStats = await getTaskStats(user.id);
            setStats(taskStats);
        } catch (err) {
            console.error("Error fetching tasks:", err);
            setError("Error al cargar las tareas");
        } finally {
            setIsLoading(false);
        }
    }, [user, view, categoryId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks, refreshKey]);

    const refresh = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const addTask = useCallback(async (taskData: Omit<InsertTask, "user_id">) => {
        if (!user) return null;

        const newTask = await createTask({
            ...taskData,
            user_id: user.id,
        });

        if (newTask) {
            refresh();
        }

        return newTask;
    }, [user, refresh]);

    const editTask = useCallback(async (taskId: string, updates: UpdateTask) => {
        const updated = await updateTask(taskId, updates);
        if (updated) {
            refresh();
        }
        return updated;
    }, [refresh]);

    const removeTask = useCallback(async (taskId: string) => {
        const deleted = await deleteTask(taskId);
        if (deleted) {
            refresh();
        }
        return deleted;
    }, [refresh]);

    const complete = useCallback(async (taskId: string, actualMinutes?: number) => {
        const completed = await completeTask(taskId, actualMinutes);
        if (completed) {
            refresh();
        }
        return completed;
    }, [refresh]);

    const uncompleteAction = useCallback(async (taskId: string) => {
        const task = await uncompleteTask(taskId);
        if (task) {
            refresh();
        }
        return task;
    }, [refresh]);

    const reorder = useCallback(async (taskIds: string[]) => {
        if (!user) return false;
        const success = await reorderTasks(user.id, taskIds);
        if (success) {
            refresh();
        }
        return success;
    }, [user, refresh]);

    return {
        tasks,
        stats,
        isLoading,
        error,
        addTask,
        editTask,
        removeTask,
        complete,
        uncomplete: uncompleteAction,
        reorder,
        refresh,
    };
}
