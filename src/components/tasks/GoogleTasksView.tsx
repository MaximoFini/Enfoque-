"use client";

import * as React from "react";
import { Plus, ChevronDown, ChevronRight, Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { TaskWithSubtasks, InsertTask, UpdateTask } from "@/lib/supabase/task-service";

interface GoogleTaskItemProps {
    task: TaskWithSubtasks;
    onComplete: (taskId: string, hasEstimate: boolean) => void;
    onUncomplete: (taskId: string) => void;
    onEdit: (task: TaskWithSubtasks) => void;
    onDelete: (taskId: string) => void;
    onAddSubtask: (parentId: string) => void;
    level?: number;
}

export function GoogleTaskItem({
    task,
    onComplete,
    onUncomplete,
    onEdit,
    onDelete,
    onAddSubtask,
    level = 0,
}: GoogleTaskItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [showMenu, setShowMenu] = React.useState(false);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isCompleted = task.status === "completed";

    const handleCheckboxChange = () => {
        if (isCompleted) {
            onUncomplete(task.id);
        } else {
            onComplete(task.id, !!task.estimated_minutes);
        }
    };

    return (
        <div className="group">
            {/* Task row */}
            <div
                className={`flex items-start gap-2 py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors ${level > 0 ? 'ml-8' : ''
                    }`}
            >
                {/* Expand/collapse for subtasks (only for level 0) */}
                {level === 0 && (
                    <button
                        onClick={() => hasSubtasks && setIsExpanded(!isExpanded)}
                        className={`p-0.5 mt-0.5 rounded ${hasSubtasks ? 'hover:bg-secondary cursor-pointer' : 'cursor-default'}`}
                    >
                        {hasSubtasks ? (
                            isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )
                        ) : (
                            <div className="w-4 h-4" />
                        )}
                    </button>
                )}

                {/* Checkbox */}
                <button
                    onClick={handleCheckboxChange}
                    className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 transition-all flex items-center justify-center ${isCompleted
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/50 hover:border-primary'
                        }`}
                >
                    {isCompleted && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                        {task.title}
                    </p>
                </div>

                {/* Actions menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                    >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-6 z-20 w-48 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border py-2">
                                {level === 0 && (
                                    <button
                                        onClick={() => {
                                            onAddSubtask(task.id);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary/80 flex items-center gap-3 text-foreground"
                                    >
                                        <Plus className="h-4 w-4 text-primary" />
                                        Añadir subtarea
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        onEdit(task);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary/80 flex items-center gap-3 text-foreground"
                                >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(task.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 flex items-center gap-3 text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Subtasks */}
            {hasSubtasks && isExpanded && (
                <div className="border-l-2 border-border/50 ml-4">
                    {task.subtasks?.map(subtask => (
                        <GoogleTaskItem
                            key={subtask.id}
                            task={subtask}
                            onComplete={onComplete}
                            onUncomplete={onUncomplete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSubtask={onAddSubtask}
                            level={1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Category Column Component
interface CategoryColumnProps {
    categoryId: string;
    categoryName: string;
    categoryEmoji: string;
    tasks: TaskWithSubtasks[];
    completedCount: number;
    onComplete: (taskId: string, hasEstimate: boolean) => void;
    onUncomplete: (taskId: string) => void;
    onEdit: (task: TaskWithSubtasks) => void;
    onDelete: (taskId: string) => void;
    onAddTask: (categoryId: string) => void;
    onAddSubtask: (parentId: string) => void;
}

export function CategoryColumn({
    categoryId,
    categoryName,
    categoryEmoji,
    tasks,
    completedCount,
    onComplete,
    onUncomplete,
    onEdit,
    onDelete,
    onAddTask,
    onAddSubtask,
}: CategoryColumnProps) {
    const [showCompleted, setShowCompleted] = React.useState(false);
    const activeTasks = tasks.filter(t => t.status !== "completed");
    const completedTasks = tasks.filter(t => t.status === "completed");

    return (
        <div className="bg-card rounded-2xl border border-border min-w-[320px] max-w-[400px] flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <span>{categoryEmoji}</span>
                    {categoryName}
                </h3>
                <button className="p-1 rounded hover:bg-secondary">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Add task button */}
            <button
                onClick={() => onAddTask(categoryId)}
                className="w-full px-4 py-3 flex items-center gap-2 text-primary hover:bg-primary/5 transition-colors border-b border-border"
            >
                <Pencil className="h-4 w-4" />
                <span className="text-sm font-medium">Agregar una tarea</span>
            </button>

            {/* Tasks list */}
            <div className="p-2 max-h-[500px] overflow-y-auto">
                {activeTasks.length > 0 ? (
                    <div className="space-y-0">
                        {activeTasks.map(task => (
                            <GoogleTaskItem
                                key={task.id}
                                task={task}
                                onComplete={onComplete}
                                onUncomplete={onUncomplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAddSubtask={onAddSubtask}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas
                    </p>
                )}

                {/* Completed section */}
                {completedCount > 0 && (
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="w-full mt-2 px-2 py-2 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showCompleted ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="text-sm">Completadas ({completedCount})</span>
                    </button>
                )}

                {showCompleted && completedTasks.length > 0 && (
                    <div className="space-y-0 opacity-60">
                        {completedTasks.map(task => (
                            <GoogleTaskItem
                                key={task.id}
                                task={task}
                                onComplete={onComplete}
                                onUncomplete={onUncomplete}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAddSubtask={onAddSubtask}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Category Sidebar Filter
interface CategoryFilterProps {
    categories: Array<{
        id: string;
        name: string;
        emoji: string;
        taskCount: number;
    }>;
    selectedCategories: Set<string>;
    onToggleCategory: (categoryId: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export function CategoryFilter({
    categories,
    selectedCategories,
    onToggleCategory,
}: CategoryFilterProps) {
    return (
        <div className="bg-card rounded-2xl border border-border p-4 w-60 flex-shrink-0">
            <h4 className="font-semibold text-foreground mb-3 flex items-center justify-between">
                Listas
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </h4>
            <div className="space-y-1">
                {categories.map(cat => (
                    <label
                        key={cat.id}
                        className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={selectedCategories.has(cat.id)}
                            onChange={() => onToggleCategory(cat.id)}
                            className="w-4 h-4 rounded border-muted-foreground/50 text-primary focus:ring-primary"
                        />
                        <span className="flex-1 text-sm text-foreground">
                            {cat.emoji} {cat.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            {cat.taskCount}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
