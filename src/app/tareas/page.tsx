"use client";

import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CategoryColumn } from "@/components/tasks/GoogleTasksView";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskCompletionModal } from "@/components/tasks/TaskCompletionModal";
import { getCategories } from "@/lib/supabase/services";
import {
    getTasksWithSubtasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask as completeTaskApi,
    uncompleteTask as uncompleteTaskApi,
    getCompletedTasks,
    type TaskWithSubtasks,
    type InsertTask,
    type UpdateTask
} from "@/lib/supabase/task-service";
import type { Category } from "@/lib/supabase/types";
import { useAuth } from "@/context/AuthContext";
import { ListTodo, LogIn, Check } from "lucide-react";
import Link from "next/link";

export default function TareasPage() {
    const { user } = useAuth();
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [allTasks, setAllTasks] = React.useState<TaskWithSubtasks[]>([]);
    const [completedTasks, setCompletedTasks] = React.useState<TaskWithSubtasks[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = React.useState(true);

    // Modal state
    const [showTaskModal, setShowTaskModal] = React.useState(false);
    const [showCompletionModal, setShowCompletionModal] = React.useState(false);
    const [editingTask, setEditingTask] = React.useState<TaskWithSubtasks | null>(null);
    const [completingTask, setCompletingTask] = React.useState<TaskWithSubtasks | null>(null);
    const [newTaskCategoryId, setNewTaskCategoryId] = React.useState<string>("");
    const [newTaskParentId, setNewTaskParentId] = React.useState<string | undefined>(undefined);

    // Load data
    const loadData = React.useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const [cats, tasks, completed] = await Promise.all([
                getCategories(),
                getTasksWithSubtasks(user.id),
                getCompletedTasks(user.id),
            ]);

            // Filter to parent categories only
            const parentCats = cats.filter(c => !c.parent_id);
            setCategories(parentCats);
            setAllTasks(tasks);
            setCompletedTasks(completed as TaskWithSubtasks[]);

            // Select all categories by default
            if (selectedCategories.size === 0) {
                setSelectedCategories(new Set(parentCats.map(c => c.id)));
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedCategories.size]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Toggle category selection
    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    // Select/deselect all
    const selectAllCategories = () => {
        setSelectedCategories(new Set(categories.map(c => c.id)));
    };

    const deselectAllCategories = () => {
        setSelectedCategories(new Set());
    };

    // Get tasks by category
    const getTasksForCategory = (categoryId: string) => {
        return allTasks.filter(t => t.category_id === categoryId);
    };

    const getCompletedCountForCategory = (categoryId: string) => {
        return completedTasks.filter(t => t.category_id === categoryId).length;
    };

    // Task actions
    const handleAddTask = (categoryId: string) => {
        setNewTaskCategoryId(categoryId);
        setNewTaskParentId(undefined);
        setEditingTask(null);
        setShowTaskModal(true);
    };

    const handleAddSubtask = (parentId: string) => {
        const parentTask = allTasks.find(t => t.id === parentId);
        setNewTaskCategoryId(parentTask?.category_id || "");
        setNewTaskParentId(parentId);
        setEditingTask(null);
        setShowTaskModal(true);
    };

    const handleEditTask = (task: TaskWithSubtasks) => {
        setEditingTask(task);
        setNewTaskCategoryId(task.category_id || "");
        setNewTaskParentId(task.parent_id || undefined);
        setShowTaskModal(true);
    };

    const handleSaveTask = async (taskData: Omit<InsertTask, "user_id"> | UpdateTask) => {
        if (!user) return;

        try {
            if (editingTask) {
                await updateTask(editingTask.id, taskData as UpdateTask);
            } else {
                await createTask({
                    ...taskData,
                    user_id: user.id,
                    category_id: newTaskCategoryId || null,
                    parent_id: newTaskParentId || null,
                } as InsertTask);
            }

            setShowTaskModal(false);
            setEditingTask(null);
            loadData();
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm("¿Eliminar esta tarea?")) {
            await deleteTask(taskId);
            loadData();
        }
    };

    const handleComplete = (taskId: string, hasEstimate: boolean) => {
        const task = findTaskById(taskId);
        if (task) {
            if (hasEstimate) {
                setCompletingTask(task);
                setShowCompletionModal(true);
            } else {
                completeTaskApi(taskId);
                loadData();
            }
        }
    };

    const handleConfirmCompletion = async (actualMinutes?: number) => {
        if (completingTask) {
            await completeTaskApi(completingTask.id, actualMinutes);
            setCompletingTask(null);
            setShowCompletionModal(false);
            loadData();
        }
    };

    const handleUncomplete = async (taskId: string) => {
        await uncompleteTaskApi(taskId);
        loadData();
    };

    // Helper to find task by ID (including subtasks)
    const findTaskById = (taskId: string): TaskWithSubtasks | null => {
        for (const task of allTasks) {
            if (task.id === taskId) return task;
            const subtask = task.subtasks?.find(s => s.id === taskId);
            if (subtask) return subtask;
        }
        return null;
    };

    // Visible categories
    const visibleCategories = categories.filter(c => selectedCategories.has(c.id));

    if (!user) {
        return (
            <MainLayout title="Tareas">
                <div className="max-w-md mx-auto text-center py-12">
                    <ListTodo className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Inicia sesión para ver tus tareas
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        Necesitas una cuenta para crear y gestionar tus tareas
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        <LogIn className="h-5 w-5" />
                        Iniciar sesión
                    </Link>
                </div>
            </MainLayout>
        );
    }

    if (isLoading) {
        return (
            <MainLayout title="Tareas">
                <div className="space-y-4">
                    <div className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-80 h-96 bg-secondary/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Tareas">
            <div className="space-y-4">
                {/* Horizontal category filter */}
                <div className="bg-card rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground mr-2">Listas:</span>

                        {/* Select all / deselect all */}
                        <button
                            onClick={selectedCategories.size === categories.length ? deselectAllCategories : selectAllCategories}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            {selectedCategories.size === categories.length ? "Deseleccionar todo" : "Seleccionar todo"}
                        </button>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Category chips */}
                        {categories.map(cat => {
                            const isSelected = selectedCategories.has(cat.id);
                            const taskCount = getTasksForCategory(cat.id).length;

                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected
                                            ? "bg-primary/20 text-primary border border-primary/30"
                                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                                        }`}
                                >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    <span>{cat.emoji}</span>
                                    <span>{cat.name}</span>
                                    <span className="text-xs opacity-60">({taskCount})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Category columns */}
                <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-4">
                        {visibleCategories.map(category => (
                            <CategoryColumn
                                key={category.id}
                                categoryId={category.id}
                                categoryName={category.name}
                                categoryEmoji={category.emoji}
                                tasks={getTasksForCategory(category.id)}
                                completedCount={getCompletedCountForCategory(category.id)}
                                onComplete={handleComplete}
                                onUncomplete={handleUncomplete}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onAddTask={handleAddTask}
                                onAddSubtask={handleAddSubtask}
                            />
                        ))}

                        {visibleCategories.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
                                <p>Selecciona al menos una categoría para ver las tareas</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                }}
                onSave={handleSaveTask}
                task={editingTask}
                parentId={newTaskParentId}
            />

            {/* Completion Modal */}
            <TaskCompletionModal
                isOpen={showCompletionModal}
                onClose={() => {
                    setShowCompletionModal(false);
                    setCompletingTask(null);
                }}
                onConfirm={handleConfirmCompletion}
                taskTitle={completingTask?.title || ""}
                estimatedMinutes={completingTask?.estimated_minutes || undefined}
            />
        </MainLayout>
    );
}
