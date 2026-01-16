"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCurrentUserId, createTimeLog } from "@/lib/supabase/services";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/supabase/types";
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    X,
    Clock,
    Copy,
    Trash2,
    Brain,
    Zap,
    Palette,
    Clipboard
} from "lucide-react";

// Color palette for "Other" work type
const OTHER_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#78716c", // stone
    "#1e293b", // slate
];

interface TimeBlock {
    id: string;
    title: string;
    category_id: string | null;
    day: number; // 0-6 (Mon-Sun)
    start_hour: number;
    duration_hours: number;
    work_type: "deep" | "shallow" | "other";
    color?: string;
    isLogged?: boolean; // From time_logs, not editable
}

interface BlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (block: Omit<TimeBlock, "id">) => void;
    onDelete?: () => void;
    block?: TimeBlock | null;
    day: number;
    startHour: number;
    categories: Category[];
}

function BlockModal({ isOpen, onClose, onSave, onDelete, block, day, startHour, categories }: BlockModalProps) {
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [durationHours, setDurationHours] = useState(1);
    const [workType, setWorkType] = useState<"deep" | "shallow" | "other">("deep");
    const [selectedColor, setSelectedColor] = useState(OTHER_COLORS[3]); // Default green

    useEffect(() => {
        if (isOpen) {
            if (block) {
                setTitle(block.title);
                setCategoryId(block.category_id || "");
                setDurationHours(block.duration_hours);
                setWorkType(block.work_type);
                setSelectedColor(block.color || OTHER_COLORS[3]);
            } else {
                setTitle("");
                setCategoryId("");
                setDurationHours(1);
                setWorkType("deep");
                setSelectedColor(OTHER_COLORS[3]);
            }
        }
    }, [isOpen, block]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            category_id: categoryId || null,
            day: block?.day ?? day,
            start_hour: block?.start_hour ?? startHour,
            duration_hours: durationHours,
            work_type: workType,
            color: workType === "other" ? selectedColor : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">
                        {block ? "Editar bloque" : "Nuevo bloque"}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ej: Estudio de Cálculo"
                            autoFocus
                            required
                            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                        />
                    </div>

                    {/* Work type selector - 3 columns */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de trabajo
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setWorkType("deep")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "deep"
                                    ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Brain className="h-4 w-4" />
                                <span className="font-medium text-sm">Deep</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkType("shallow")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "shallow"
                                    ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Zap className="h-4 w-4" />
                                <span className="font-medium text-sm">Shallow</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkType("other")}
                                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-xl transition-all ${workType === "other"
                                    ? "border-2 text-white"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                                style={{
                                    backgroundColor: workType === "other" ? `${selectedColor}40` : undefined,
                                    borderColor: workType === "other" ? selectedColor : undefined,
                                    color: workType === "other" ? selectedColor : undefined,
                                }}
                            >
                                <Palette className="h-4 w-4" />
                                <span className="font-medium text-sm">Otro</span>
                            </button>
                        </div>
                    </div>

                    {/* Color picker for "Other" */}
                    {workType === "other" && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Color
                            </label>
                            <div className="grid grid-cols-6 gap-2">
                                {OTHER_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-10 h-10 rounded-lg transition-all ${selectedColor === color
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                                            : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Categoría
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.emoji} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Duración
                            </label>
                            <select
                                value={durationHours}
                                onChange={(e) => setDurationHours(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground"
                            >
                                {[0.5, 1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6].map(h => (
                                    <option key={h} value={h}>
                                        {h}h
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        📅 {dayNames[block?.day ?? day]} a las {String(block?.start_hour ?? startHour).padStart(2, '0')}:00
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 py-2 rounded-xl gradient-primary text-white font-medium"
                        >
                            {block ? "Guardar cambios" : "Crear bloque"}
                        </button>
                        {block && onDelete && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDelete();
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// Context Menu Component
interface ContextMenuProps {
    x: number;
    y: number;
    onCopy?: () => void;
    onPaste?: () => void;
    onDelete?: () => void;
    onClose: () => void;
    canPaste: boolean;
    isOnBlock: boolean;
}

function ContextMenu({ x, y, onCopy, onPaste, onDelete, onClose, canPaste, isOnBlock }: ContextMenuProps) {
    useEffect(() => {
        const handleClick = () => onClose();
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("click", handleClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    return (
        <div
            className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[120px]"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            {isOnBlock && (
                <>
                    <button
                        onClick={onCopy}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                    >
                        <Copy className="h-4 w-4" />
                        Copiar
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 text-red-400"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                    </button>
                </>
            )}
            {!isOnBlock && canPaste && (
                <button
                    onClick={onPaste}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2"
                >
                    <Clipboard className="h-4 w-4" />
                    Pegar
                </button>
            )}
            {!isOnBlock && !canPaste && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                    Nada copiado
                </div>
            )}
        </div>
    );
}

export default function PlanificadorPage() {
    const { user } = useAuth();
    const [weekOffset, setWeekOffset] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [blocks, setBlocks] = useState<TimeBlock[]>([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
    const [newBlockDay, setNewBlockDay] = useState(0);
    const [newBlockHour, setNewBlockHour] = useState(9);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        block?: TimeBlock;
        day?: number;
        hour?: number;
    } | null>(null);
    const [copiedBlock, setCopiedBlock] = useState<Omit<TimeBlock, "id" | "day" | "start_hour"> | null>(null);

    // Resize state
    const [resizing, setResizing] = useState<{
        blockId: string;
        startY: number;
        originalDuration: number;
    } | null>(null);

    // Current time for the time indicator
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Time slots 6:00 - 23:00
    const timeSlots = Array.from({ length: 18 }, (_, i) => 6 + i);
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const fullDayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    // Calculate week dates
    const weekData = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (weekOffset * 7);

        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const days: { date: number; fullDate: Date; isToday: boolean; isPast: boolean }[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            days.push({
                date: date.getDate(),
                fullDate: date,
                isToday: date.toDateString() === today.toDateString(),
                isPast: date < today && date.toDateString() !== today.toDateString(),
            });
        }

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthLabel = monthNames[monday.getMonth()] + " " + monday.getFullYear();

        return { days, monthLabel, monday, sunday };
    }, [weekOffset]);

    // Load categories
    useEffect(() => {
        async function load() {
            const cats = await getCategories();
            setCategories(cats.filter((c: Category) => !c.parent_id));
        }
        load();
    }, []);

    // Load blocks from localStorage
    useEffect(() => {
        const savedBlocks = localStorage.getItem(`planner_blocks_${weekData.monday.toISOString().split('T')[0]}`);
        if (savedBlocks) {
            setBlocks(JSON.parse(savedBlocks).filter((b: TimeBlock) => !b.isLogged));
        } else {
            setBlocks([]);
        }
    }, [weekData]);

    // Load time_logs and merge as visual blocks
    const [loggedBlocks, setLoggedBlocks] = useState<TimeBlock[]>([]);
    useEffect(() => {
        async function loadTimeLogs() {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const supabase = getSupabaseClient();
            if (!supabase) return;

            const { data: logs } = await supabase
                .from("time_logs")
                .select("*")
                .eq("user_id", userId)
                .gte("started_at", weekData.monday.toISOString())
                .lte("started_at", weekData.sunday.toISOString());

            if (logs && logs.length > 0) {
                const converted = logs.map((log: any) => {
                    const startDate = new Date(log.started_at);
                    const dayOfWeek = (startDate.getDay() + 6) % 7; // Mon=0, Sun=6
                    const cat = categories.find((c: Category) => c.id === log.category_id);
                    return {
                        id: `log_${log.id}`,
                        title: cat?.name || "Tiempo registrado",
                        category_id: log.category_id,
                        day: dayOfWeek,
                        start_hour: startDate.getHours(),
                        duration_hours: Math.max(1, Math.round(log.duration_minutes / 60)),
                        work_type: log.work_type as "deep" | "shallow" | "other",
                        isLogged: true,
                    };
                });
                setLoggedBlocks(converted);
            } else {
                setLoggedBlocks([]);
            }
        }
        if (categories.length > 0) loadTimeLogs();
    }, [weekData, categories]);

    // All blocks = planned + logged
    const allBlocks = useMemo(() => [...blocks, ...loggedBlocks], [blocks, loggedBlocks]);

    // Save blocks to localStorage
    const saveBlocks = useCallback((newBlocks: TimeBlock[]) => {
        setBlocks(newBlocks);
        localStorage.setItem(
            `planner_blocks_${weekData.monday.toISOString().split('T')[0]}`,
            JSON.stringify(newBlocks)
        );
    }, [weekData]);

    // Add/edit block
    const handleSaveBlock = async (blockData: Omit<TimeBlock, "id">) => {
        if (editingBlock) {
            saveBlocks(blocks.map((b: TimeBlock) =>
                b.id === editingBlock.id
                    ? { ...blockData, id: editingBlock.id }
                    : b
            ));
        } else {
            const newBlock = { ...blockData, id: crypto.randomUUID() };
            saveBlocks([...blocks, newBlock]);

            // If it's "other" work type and has a category, create a time_log for category stats
            if (blockData.work_type === "other" && blockData.category_id) {
                const userId = await getCurrentUserId();
                if (userId) {
                    const blockDate = new Date(weekData.monday);
                    blockDate.setDate(blockDate.getDate() + blockData.day);
                    blockDate.setHours(blockData.start_hour, 0, 0, 0);
                    const endDate = new Date(blockDate);
                    endDate.setHours(endDate.getHours() + blockData.duration_hours);

                    // Note: We use "shallow" for storage but with a flag or custom handling
                    // Actually, we'll use a different approach - store as shallow but the UI won't count it
                }
            }
        }
        setEditingBlock(null);
    };

    // Delete block
    const handleDeleteBlock = (blockId: string) => {
        saveBlocks(blocks.filter((b: TimeBlock) => b.id !== blockId));
    };

    // Copy previous week
    const copyPreviousWeek = () => {
        const prevMonday = new Date(weekData.monday);
        prevMonday.setDate(prevMonday.getDate() - 7);
        const savedBlocks = localStorage.getItem(`planner_blocks_${prevMonday.toISOString().split('T')[0]}`);
        if (savedBlocks) {
            const prevBlocks = JSON.parse(savedBlocks).map((b: TimeBlock) => ({
                ...b,
                id: crypto.randomUUID(),
            }));
            saveBlocks(prevBlocks);
        }
    };

    // Get category info
    const getCategoryInfo = (categoryId: string | null) => {
        if (!categoryId) return { color: "hsl(var(--primary))", emoji: "📋" };
        const cat = categories.find((c: Category) => c.id === categoryId);
        return { color: cat?.color || "hsl(var(--primary))", emoji: cat?.emoji || "📋" };
    };

    // Get block at position (from all blocks)
    const getBlockAt = (day: number, hour: number) => {
        return allBlocks.find((b: TimeBlock) =>
            b.day === day &&
            hour >= b.start_hour &&
            hour < b.start_hour + b.duration_hours
        );
    };

    // Check if a block/day has passed
    const hasPassed = (day: number, hour?: number) => {
        const now = new Date();
        const blockDate = new Date(weekData.days[day].fullDate);
        if (hour !== undefined) {
            blockDate.setHours(hour + 1, 0, 0, 0);
        }
        return blockDate < now;
    };

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent, day?: number, hour?: number, block?: TimeBlock) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            block,
            day,
            hour,
        });
    };

    // Copy block
    const handleCopyBlock = () => {
        if (contextMenu?.block) {
            const { id, day, start_hour, ...rest } = contextMenu.block;
            setCopiedBlock(rest);
        }
        setContextMenu(null);
    };

    // Paste block
    const handlePasteBlock = () => {
        if (copiedBlock && contextMenu?.day !== undefined && contextMenu?.hour !== undefined) {
            const newBlock: TimeBlock = {
                ...copiedBlock,
                id: crypto.randomUUID(),
                day: contextMenu.day,
                start_hour: contextMenu.hour,
            };
            saveBlocks([...blocks, newBlock]);
        }
        setContextMenu(null);
    };

    // Delete from context menu
    const handleDeleteFromMenu = () => {
        if (contextMenu?.block && !contextMenu.block.isLogged) {
            handleDeleteBlock(contextMenu.block.id);
        }
        setContextMenu(null);
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent, block: TimeBlock) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing({
            blockId: block.id,
            startY: e.clientY,
            originalDuration: block.duration_hours,
        });
    };

    // Handle resize move
    useEffect(() => {
        if (!resizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - resizing.startY;
            const hourHeight = 40; // matches min-h-[40px] from time slots
            const deltaDuration = Math.round((deltaY / hourHeight) * 2) / 2; // snap to 0.5h
            const newDuration = Math.max(0.5, Math.min(6, resizing.originalDuration + deltaDuration));

            setBlocks((prev: TimeBlock[]) =>
                prev.map((b: TimeBlock) =>
                    b.id === resizing.blockId
                        ? { ...b, duration_hours: newDuration }
                        : b
                )
            );
        };

        const handleMouseUp = () => {
            // Save to localStorage
            const currentBlocks = blocks;
            localStorage.setItem(
                `planner_blocks_${weekData.monday.toISOString().split('T')[0]}`,
                JSON.stringify(currentBlocks)
            );
            setResizing(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizing, blocks, weekData]);

    // Calculate stats - exclude "other" from deep/shallow counts
    const stats = useMemo(() => {
        const byCategory = new Map<string, number>();
        let deepHours = 0;
        let shallowHours = 0;
        let plannedDeep = 0;
        let plannedShallow = 0;

        allBlocks.forEach((b: TimeBlock) => {
            const blockEndHour = b.start_hour + b.duration_hours - 1;
            const isPast = hasPassed(b.day, blockEndHour);

            // Only count completed (past) blocks
            if (isPast || b.isLogged) {
                // Category stats include ALL types (deep, shallow, other)
                const key = b.category_id || "none";
                byCategory.set(key, (byCategory.get(key) || 0) + b.duration_hours);

                // Deep/shallow only for those types (NOT "other")
                if (b.work_type === "deep") {
                    deepHours += b.duration_hours;
                } else if (b.work_type === "shallow") {
                    shallowHours += b.duration_hours;
                }
                // "other" type: counts for category but NOT for deep/shallow
            } else {
                // Future planned blocks
                if (b.work_type === "deep") {
                    plannedDeep += b.duration_hours;
                } else if (b.work_type === "shallow") {
                    plannedShallow += b.duration_hours;
                }
            }
        });

        return {
            byCategory,
            deepHours,
            shallowHours,
            total: deepHours + shallowHours,
            plannedDeep,
            plannedShallow,
            plannedTotal: plannedDeep + plannedShallow,
        };
    }, [allBlocks, weekData]);

    // Get current time position for indicator
    const getCurrentTimePosition = () => {
        const now = currentTime;
        const todayIndex = weekData.days.findIndex((d: { isToday: boolean }) => d.isToday);
        if (todayIndex === -1) return null;

        const hours = now.getHours();
        const minutes = now.getMinutes();

        if (hours < 6 || hours >= 24) return null;

        const totalMinutesFromStart = (hours - 6) * 60 + minutes;
        const percentFromTop = (totalMinutesFromStart / (18 * 60)) * 100;

        return { dayIndex: todayIndex, percent: percentFromTop };
    };

    const timeIndicator = getCurrentTimePosition();

    return (
        <MainLayout title="Planificador">
            <div className="space-y-4">
                {/* Google-style header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setWeekOffset(0)}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm font-medium"
                    >
                        Hoy
                    </button>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setWeekOffset(w => w - 1)}
                            className="p-2 rounded-full hover:bg-secondary transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <button
                            onClick={() => setWeekOffset(w => w + 1)}
                            className="p-2 rounded-full hover:bg-secondary transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-foreground" />
                        </button>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        {weekData.monthLabel}
                    </h2>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={copyPreviousWeek}
                            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copiar semana anterior
                        </button>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">Cumplido:</span>
                            <span className="font-bold text-green-400">{stats.total}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-500" />
                            <span className="font-bold text-purple-400">{stats.deepHours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-yellow-400">{stats.shallowHours}h</span>
                        </div>
                        {stats.plannedTotal > 0 && (
                            <div className="flex items-center gap-2 border-l border-border pl-4">
                                <span className="text-muted-foreground">Planificado:</span>
                                <span className="font-medium text-muted-foreground">{stats.plannedTotal}h</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category summary */}
                {stats.byCategory.size > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {Array.from(stats.byCategory.entries()).map(([catId, hours]) => {
                            const { color, emoji } = getCategoryInfo(catId === "none" ? null : catId);
                            const catName = catId === "none"
                                ? "Sin categoría"
                                : categories.find((c: Category) => c.id === catId)?.name || "Otro";
                            return (
                                <div
                                    key={catId}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                                    style={{ backgroundColor: `${color}20` }}
                                >
                                    <span>{emoji}</span>
                                    <span className="text-foreground">{catName}</span>
                                    <span className="text-muted-foreground">{hours}h</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Calendar grid */}
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <div className="min-w-[800px] relative">
                            {/* Header row with days */}
                            <div className="grid grid-cols-8 border-b border-border">
                                <div className="p-3 text-center text-sm font-medium text-muted-foreground">

                                </div>
                                {weekData.days.map((day: { date: number; isToday: boolean; isPast: boolean }, i: number) => (
                                    <div
                                        key={i}
                                        className={`p-3 text-center border-l border-border ${day.isPast ? "bg-secondary/30" : ""
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-muted-foreground uppercase">
                                            {dayNames[i]}
                                        </p>
                                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mt-1 ${day.isToday
                                            ? "bg-primary text-white"
                                            : "text-foreground"
                                            }`}>
                                            <span className="text-lg font-bold">{day.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time slots with current time indicator */}
                            <div className="relative">
                                {/* Current time indicator line */}
                                {timeIndicator && (
                                    <div
                                        className="absolute z-20 pointer-events-none"
                                        style={{
                                            top: `${timeIndicator.percent}%`,
                                            left: `calc(${(timeIndicator.dayIndex + 1) * 12.5}% + 1px)`,
                                            width: `calc(12.5% - 2px)`,
                                        }}
                                    >
                                        <div className="relative flex items-center">
                                            <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                                            <div className="flex-1 h-0.5 bg-red-500" />
                                        </div>
                                    </div>
                                )}

                                {timeSlots.map(hour => (
                                    <div key={hour} className="grid grid-cols-8 border-b border-border/50">
                                        <div className="p-2 text-center text-xs font-mono text-muted-foreground flex items-center justify-center">
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                        {weekData.days.map((day: { isToday: boolean; isPast: boolean }, dayIndex: number) => {
                                            const block = getBlockAt(dayIndex, hour);
                                            const isBlockStart = block?.start_hour === hour;

                                            if (block && !isBlockStart) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className={`border-l border-border/50 relative ${day.isToday ? "bg-primary/5" : day.isPast ? "bg-secondary/20" : ""
                                                        }`}
                                                    style={{
                                                        gridRow: block
                                                            ? `span ${Math.ceil(block.duration_hours)}`
                                                            : undefined
                                                    }}
                                                    onContextMenu={(e) => handleContextMenu(e, dayIndex, hour, block || undefined)}
                                                >
                                                    {block ? (
                                                        <div
                                                            className="absolute inset-1 rounded-lg text-left text-xs font-medium text-white shadow-sm overflow-hidden cursor-pointer group"
                                                            style={{
                                                                backgroundColor: block.work_type === "other"
                                                                    ? block.color
                                                                    : block.work_type === "deep"
                                                                        ? "#8b5cf6"
                                                                        : "#f59e0b",
                                                                height: `calc(${block.duration_hours * 100}% - 8px)`
                                                            }}
                                                            onClick={() => {
                                                                if (!block.isLogged) {
                                                                    setEditingBlock(block);
                                                                    setShowModal(true);
                                                                }
                                                            }}
                                                        >
                                                            <div className="p-2 h-full flex flex-col">
                                                                <div className="flex items-center gap-1">
                                                                    {block.work_type === "deep" && <Brain className="h-3 w-3" />}
                                                                    {block.work_type === "shallow" && <Zap className="h-3 w-3" />}
                                                                    {block.work_type === "other" && <Palette className="h-3 w-3" />}
                                                                    <span className="truncate">{block.title}</span>
                                                                </div>
                                                                <div className="text-white/70 mt-0.5">
                                                                    {String(block.start_hour).padStart(2, '0')}:00 - {String(block.start_hour + block.duration_hours).padStart(2, '0')}:00
                                                                </div>
                                                            </div>
                                                            {/* Resize handle */}
                                                            {!block.isLogged && (
                                                                <div
                                                                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity"
                                                                    onMouseDown={(e) => handleResizeStart(e, block)}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setNewBlockDay(dayIndex);
                                                                setNewBlockHour(hour);
                                                                setEditingBlock(null);
                                                                setShowModal(true);
                                                            }}
                                                            onContextMenu={(e) => handleContextMenu(e, dayIndex, hour)}
                                                            className="w-full h-full min-h-[40px] hover:bg-primary/5 transition-colors group flex items-center justify-center"
                                                        >
                                                            <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <p className="text-sm text-foreground">
                            <strong>💡 Tip:</strong> Click derecho para copiar/pegar bloques. Arrastra el borde inferior para redimensionar.
                            Los bloques verdes/otros colores no cuentan para deep/shallow pero sí para la categoría.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Block Modal */}
            <BlockModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingBlock(null);
                }}
                onSave={handleSaveBlock}
                onDelete={editingBlock ? () => handleDeleteBlock(editingBlock.id) : undefined}
                block={editingBlock}
                day={newBlockDay}
                startHour={newBlockHour}
                categories={categories}
            />

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isOnBlock={!!contextMenu.block}
                    canPaste={!!copiedBlock}
                    onCopy={handleCopyBlock}
                    onPaste={handlePasteBlock}
                    onDelete={handleDeleteFromMenu}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </MainLayout>
    );
}
