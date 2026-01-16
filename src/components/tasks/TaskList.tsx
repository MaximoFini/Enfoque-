"use client";

import * as React from "react";
import { TaskItem } from "./TaskItem";
import { TaskModal } from "./TaskModal";
import { TaskCompletionModal } from "./TaskCompletionModal";
import { Plus, ListTodo } from "lucide-react";
import type { TaskWithSubtasks, InsertTask, UpdateTask } from "@/lib/supabase/task-service";

interface TaskListProps {
    tasks: TaskWithSubtasks[];
    isLoading?: boolean;
    emptyMessage?: string;
    onAddTask: (task: Omit<InsertTask, "user_id">) => Promise<unknown>;
    onEditTask: (taskId: string, updates: UpdateTask) => Promise<unknown>;
    onDeleteTask: (taskId: string) => Promise<boolean>;
    onCompleteTask: (taskId: string, actualMinutes?: number) => Promise<unknown>;
    onUncompleteTask: (taskId: string) => Promise<unknown>;
    onReorderTasks?: (taskIds: string[]) => Promise<boolean>;
    showAddButton?: boolean;
}

export function TaskList({
    tasks,
    isLoading = false,
    emptyMessage = "No hay tareas",
    onAddTask,
    onEditTask,
    onDeleteTask,
    onCompleteTask,
    onUncompleteTask,
    onReorderTasks,
    showAddButton = true,
}: TaskListProps) {
    const [showTaskModal, setShowTaskModal] = React.useState(false);
    const [showCompletionModal, setShowCompletionModal] = React.useState(false);
    const [editingTask, setEditingTask] = React.useState<TaskWithSubtasks | null>(null);
    const [completingTask, setCompletingTask] = React.useState<TaskWithSubtasks | null>(null);

    // Drag state
    const [draggedId, setDraggedId] = React.useState<string | null>(null);
    const [dragOverId, setDragOverId] = React.useState<string | null>(null);

    const handleComplete = (taskId: string, hasEstimate: boolean) => {
        const task = tasks.find(t => t.id === taskId) ||
            tasks.flatMap(t => t.subtasks || []).find(s => s.id === taskId);

        if (task) {
            if (hasEstimate) {
                // Show completion modal to ask for actual time
                setCompletingTask(task as TaskWithSubtasks);
                setShowCompletionModal(true);
            } else {
                // Complete without asking for time
                onCompleteTask(taskId);
            }
        }
    };

    const handleConfirmCompletion = async (actualMinutes?: number) => {
        if (completingTask) {
            await onCompleteTask(completingTask.id, actualMinutes);
            setCompletingTask(null);
            setShowCompletionModal(false);
        }
    };

    const handleEdit = (task: TaskWithSubtasks) => {
        setEditingTask(task);
        setShowTaskModal(true);
    };

    const handleSaveTask = async (taskData: Omit<InsertTask, "user_id"> | UpdateTask) => {
        if (editingTask) {
            await onEditTask(editingTask.id, taskData as UpdateTask);
        } else {
            await onAddTask(taskData as Omit<InsertTask, "user_id">);
        }
        setEditingTask(null);
    };

    const handleCloseModal = () => {
        setShowTaskModal(false);
        setEditingTask(null);
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedId(taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        if (draggedId !== taskId) {
            setDragOverId(taskId);
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();

        if (draggedId && draggedId !== targetId && onReorderTasks) {
            const taskIds = tasks.map(t => t.id);
            const draggedIndex = taskIds.indexOf(draggedId);
            const targetIndex = taskIds.indexOf(targetId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                // Reorder array
                const newOrder = [...taskIds];
                newOrder.splice(draggedIndex, 1);
                newOrder.splice(targetIndex, 0, draggedId);

                await onReorderTasks(newOrder);
            }
        }

        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                        <div className="h-16 bg-secondary rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Add button */}
            {showAddButton && (
                <button
                    onClick={() => setShowTaskModal(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Añadir tarea</span>
                </button>
            )}

            {/* Task list */}
            {tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragOver={(e) => handleDragOver(e, task.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className={`transition-all ${dragOverId === task.id ? 'border-t-2 border-primary pt-2' : ''
                                }`}
                        >
                            <TaskItem
                                task={task}
                                onComplete={handleComplete}
                                onUncomplete={onUncompleteTask}
                                onEdit={handleEdit}
                                onDelete={onDeleteTask}
                                isDragging={draggedId === task.id}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 rounded-xl bg-secondary/50 border border-border/50 text-center">
                    <ListTodo className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{emptyMessage}</p>
                    {showAddButton && (
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="mt-3 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            + Crear primera tarea
                        </button>
                    )}
                </div>
            )}

            {/* Task Modal */}
            <TaskModal
                isOpen={showTaskModal}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
                task={editingTask}
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
        </div>
    );
}
