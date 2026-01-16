"use client";

import * as React from "react";
import { X, Plus, Clock, Calendar, Flag, Folder } from "lucide-react";
import { getCategories } from "@/lib/supabase/services";
import type { Category } from "@/lib/supabase/types";
import type { TaskWithSubtasks, InsertTask, UpdateTask } from "@/lib/supabase/task-service";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<InsertTask, "user_id"> | UpdateTask) => Promise<unknown>;
    task?: TaskWithSubtasks | null; // If provided, editing mode
    parentId?: string; // If provided, creating a subtask
}

export function TaskModal({
    isOpen,
    onClose,
    onSave,
    task,
    parentId,
}: TaskModalProps) {
    const isEditing = !!task;

    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [categoryId, setCategoryId] = React.useState<string>("");
    const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
    const [dueDate, setDueDate] = React.useState<string>("");
    const [estimatedMinutes, setEstimatedMinutes] = React.useState<number>(0);
    const [isSaving, setIsSaving] = React.useState(false);
    const [categories, setCategories] = React.useState<Category[]>([]);

    // Load categories from Supabase
    React.useEffect(() => {
        async function loadCategories() {
            const cats = await getCategories();
            // Filter to only show parent categories (no subcategories)
            setCategories(cats.filter(c => !c.parent_id));
        }
        loadCategories();
    }, []);

    // Reset form when opening/closing or task changes
    React.useEffect(() => {
        if (isOpen) {
            if (task) {
                setTitle(task.title);
                setDescription(task.description || "");
                setCategoryId(task.category_id || "");
                setPriority(task.priority);
                setDueDate(task.due_date || "");
                setEstimatedMinutes(task.estimated_minutes || 0);
            } else {
                setTitle("");
                setDescription("");
                // For new tasks, don't reset category if it was pre-set
                setPriority("medium");
                setDueDate(new Date().toISOString().split('T')[0]); // Default to today
                setEstimatedMinutes(0);
            }
        }
    }, [isOpen, task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSaving(true);

        try {
            const taskData = {
                title: title.trim(),
                description: description.trim() || null,
                category_id: categoryId || null,
                priority,
                due_date: dueDate || null,
                estimated_minutes: estimatedMinutes > 0 ? estimatedMinutes : null,
                parent_id: parentId || null,
            };

            await onSave(taskData);
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <Plus className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isEditing ? "Editar tarea" : parentId ? "Nueva subtarea" : "Nueva tarea"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué necesitas hacer?"
                            required
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles adicionales..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Row: Category & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                <Folder className="h-4 w-4 inline mr-1" />
                                Categoría
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                <Flag className="h-4 w-4 inline mr-1" />
                                Prioridad
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="low">🟢 Baja</option>
                                <option value="medium">🟡 Media</option>
                                <option value="high">🔴 Alta</option>
                            </select>
                        </div>
                    </div>

                    {/* Row: Due Date & Estimated Time */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Estimated Time */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Tiempo estimado
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="480"
                                    value={estimatedMinutes || ""}
                                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <span className="text-sm text-muted-foreground">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick time buttons */}
                    <div className="flex flex-wrap gap-2">
                        {[15, 30, 45, 60, 90, 120].map((mins) => (
                            <button
                                key={mins}
                                type="button"
                                onClick={() => setEstimatedMinutes(mins)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${estimatedMinutes === mins
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary hover:bg-accent text-foreground'
                                    }`}
                            >
                                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                            </button>
                        ))}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!title.trim() || isSaving}
                        className="w-full py-4 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5" />
                                {isEditing ? "Guardar cambios" : "Crear tarea"}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
