"use client";

import * as React from "react";
import { GripVertical, ChevronDown, ChevronRight, Trash2, Clock, Edit2 } from "lucide-react";
import { type TaskWithSubtasks } from "@/lib/supabase/task-service";
import { getCategoryById } from "@/lib/data/categories";

interface TaskItemProps {
    task: TaskWithSubtasks;
    onComplete: (taskId: string, hasEstimate: boolean) => void;
    onUncomplete: (taskId: string) => void;
    onEdit: (task: TaskWithSubtasks) => void;
    onDelete: (taskId: string) => void;
    isDragging?: boolean;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function TaskItem({
    task,
    onComplete,
    onUncomplete,
    onEdit,
    onDelete,
    isDragging = false,
    dragHandleProps,
}: TaskItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isCompleted = task.status === "completed";
    const category = task.category_id ? getCategoryById(task.category_id) : null;

    const handleCheckboxChange = () => {
        if (isCompleted) {
            onUncomplete(task.id);
        } else {
            onComplete(task.id, !!task.estimated_minutes);
        }
    };

    const completedSubtasks = task.subtasks?.filter(s => s.status === "completed").length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    return (
        <div
            className={`group transition-all duration-200 ${isDragging ? 'opacity-50 scale-[1.02]' : ''
                }`}
        >
            {/* Main task */}
            <div
                className={`flex items-center gap-2 p-3 rounded-xl transition-all ${isCompleted
                        ? 'bg-secondary/30'
                        : 'bg-card hover:bg-secondary/50'
                    } border border-border/50`}
            >
                {/* Drag handle */}
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Expand/collapse for subtasks */}
                {hasSubtasks ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded hover:bg-secondary/50"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>
                ) : (
                    <div className="w-6" />
                )}

                {/* Checkbox */}
                <button
                    onClick={handleCheckboxChange}
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isCompleted
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground/40 hover:border-primary'
                        }`}
                >
                    {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                        {task.title}
                    </p>

                    {/* Subtask progress */}
                    {hasSubtasks && (
                        <p className="text-xs text-muted-foreground">
                            {completedSubtasks}/{totalSubtasks} subtareas
                        </p>
                    )}
                </div>

                {/* Time badge */}
                {task.estimated_minutes && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isCompleted && task.actual_minutes
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                        <Clock className="h-3 w-3" />
                        {isCompleted && task.actual_minutes ? (
                            <span>{task.actual_minutes}m</span>
                        ) : (
                            <span>{task.estimated_minutes}m</span>
                        )}
                    </div>
                )}

                {/* Category badge */}
                {category && (
                    <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: `${category.color}20` }}
                    >
                        <span>{category.emoji}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Subtasks */}
            {hasSubtasks && isExpanded && (
                <div className="ml-10 mt-1 space-y-1">
                    {task.subtasks?.map(subtask => (
                        <SubtaskItem
                            key={subtask.id}
                            task={subtask}
                            onComplete={onComplete}
                            onUncomplete={onUncomplete}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Simplified subtask item
interface SubtaskItemProps {
    task: TaskWithSubtasks;
    onComplete: (taskId: string, hasEstimate: boolean) => void;
    onUncomplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
}

function SubtaskItem({ task, onComplete, onUncomplete, onDelete }: SubtaskItemProps) {
    const isCompleted = task.status === "completed";

    const handleCheckboxChange = () => {
        if (isCompleted) {
            onUncomplete(task.id);
        } else {
            onComplete(task.id, !!task.estimated_minutes);
        }
    };

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg transition-all group ${isCompleted ? 'bg-secondary/20' : 'hover:bg-secondary/30'
            }`}>
            {/* Checkbox */}
            <button
                onClick={handleCheckboxChange}
                className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${isCompleted
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/40 hover:border-primary'
                    }`}
            >
                {isCompleted && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Content */}
            <span className={`flex-1 text-sm ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}>
                {task.title}
            </span>

            {/* Time */}
            {task.estimated_minutes && (
                <span className="text-xs text-muted-foreground">
                    {isCompleted && task.actual_minutes ? `${task.actual_minutes}m` : `${task.estimated_minutes}m`}
                </span>
            )}

            {/* Delete */}
            <button
                onClick={() => onDelete(task.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
            >
                <Trash2 className="h-3 w-3 text-red-500" />
            </button>
        </div>
    );
}
