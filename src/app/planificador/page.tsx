"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCurrentUserId } from "@/lib/supabase/services";
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
    Zap
} from "lucide-react";

interface TimeBlock {
    id: string;
    title: string;
    category_id: string | null;
    day: number; // 0-6 (Mon-Sun)
    start_hour: number;
    duration_hours: number;
    work_type: "deep" | "shallow";
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
    const [workType, setWorkType] = useState<"deep" | "shallow">("deep");

    useEffect(() => {
        if (isOpen) {
            if (block) {
                setTitle(block.title);
                setCategoryId(block.category_id || "");
                setDurationHours(block.duration_hours);
                setWorkType(block.work_type);
            } else {
                setTitle("");
                setCategoryId("");
                setDurationHours(1);
                setWorkType("deep");
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

                    {/* Work type selector */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Tipo de trabajo
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setWorkType("deep")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${workType === "deep"
                                    ? "bg-purple-500/20 border-2 border-purple-500 text-purple-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Brain className="h-5 w-5" />
                                <span className="font-medium">Deep Work</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setWorkType("shallow")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${workType === "shallow"
                                    ? "bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400"
                                    : "bg-secondary border-2 border-transparent hover:bg-secondary/80"
                                    }`}
                            >
                                <Zap className="h-5 w-5" />
                                <span className="font-medium">Shallow</span>
                            </button>
                        </div>
                    </div>

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
                                {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(h => (
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

    // Time slots 6:00 - 23:00
    const timeSlots = Array.from({ length: 18 }, (_, i) => 6 + i);
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Calculate week dates
    const weekData = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + (weekOffset * 7);

        const monday = new Date(today);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const days = [];
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

        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const weekLabel = `${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;

        return { days, weekLabel, monday, sunday };
    }, [weekOffset]);

    // Load categories
    useEffect(() => {
        async function load() {
            const cats = await getCategories();
            setCategories(cats.filter(c => !c.parent_id));
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
                    const cat = categories.find(c => c.id === log.category_id);
                    return {
                        id: `log_${log.id}`,
                        title: cat?.name || "Tiempo registrado",
                        category_id: log.category_id,
                        day: dayOfWeek,
                        start_hour: startDate.getHours(),
                        duration_hours: Math.max(1, Math.round(log.duration_minutes / 60)),
                        work_type: log.work_type as "deep" | "shallow",
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
    const handleSaveBlock = (blockData: Omit<TimeBlock, "id">) => {
        if (editingBlock) {
            saveBlocks(blocks.map(b =>
                b.id === editingBlock.id
                    ? { ...blockData, id: editingBlock.id }
                    : b
            ));
        } else {
            saveBlocks([...blocks, { ...blockData, id: crypto.randomUUID() }]);
        }
        setEditingBlock(null);
    };

    // Delete block
    const handleDeleteBlock = (blockId: string) => {
        saveBlocks(blocks.filter(b => b.id !== blockId));
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
        const cat = categories.find(c => c.id === categoryId);
        return { color: cat?.color || "hsl(var(--primary))", emoji: cat?.emoji || "📋" };
    };

    // Get block at position (from all blocks)
    const getBlockAt = (day: number, hour: number) => {
        return allBlocks.find(b =>
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
            blockDate.setHours(hour + 1, 0, 0, 0); // Block must complete to count
        }
        return blockDate < now;
    };

    // Calculate hours - ONLY for past events
    const stats = useMemo(() => {
        const byCategory = new Map<string, number>();
        let deepHours = 0;
        let shallowHours = 0;
        let plannedDeep = 0;
        let plannedShallow = 0;

        allBlocks.forEach(b => {
            const blockEndHour = b.start_hour + b.duration_hours - 1;
            const isPast = hasPassed(b.day, blockEndHour);

            // Only count completed (past) blocks
            if (isPast || b.isLogged) {
                const key = b.category_id || "none";
                byCategory.set(key, (byCategory.get(key) || 0) + b.duration_hours);

                if (b.work_type === "deep") {
                    deepHours += b.duration_hours;
                } else {
                    shallowHours += b.duration_hours;
                }
            } else {
                // Future planned blocks - show separately
                if (b.work_type === "deep") {
                    plannedDeep += b.duration_hours;
                } else {
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

    return (
        <MainLayout title="Planificador">
            <div className="space-y-6">
                {/* Header with navigation */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setWeekOffset(w => w - 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {weekData.weekLabel}
                                </h2>
                                {weekOffset !== 0 && (
                                    <button
                                        onClick={() => setWeekOffset(0)}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Ir a esta semana
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setWeekOffset(w => w + 1)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-foreground" />
                            </button>
                        </div>
                    </CardContent>
                </Card>

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
                                : categories.find(c => c.id === catId)?.name || "Otro";
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
                        <div className="min-w-[800px]">
                            {/* Header row */}
                            <div className="grid grid-cols-8 border-b border-border">
                                <div className="p-3 text-center text-sm font-medium text-muted-foreground">
                                    Hora
                                </div>
                                {weekData.days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 text-center border-l border-border ${day.isToday ? "bg-primary/10" : day.isPast ? "bg-secondary/30" : ""
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {dayNames[i]}
                                        </p>
                                        <p className={`text-lg font-bold ${day.isToday ? "text-primary" : "text-foreground"
                                            }`}>
                                            {day.date}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Time slots */}
                            {timeSlots.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-border/50">
                                    <div className="p-2 text-center text-xs font-mono text-muted-foreground flex items-center justify-center">
                                        {String(hour).padStart(2, '0')}:00
                                    </div>
                                    {weekData.days.map((day, dayIndex) => {
                                        const block = getBlockAt(dayIndex, hour);
                                        const isBlockStart = block?.start_hour === hour;

                                        // Skip if this is a continuation of a block
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
                                                        ? `span ${block.duration_hours}`
                                                        : undefined
                                                }}
                                            >
                                                {block ? (
                                                    <button
                                                        onClick={() => {
                                                            setEditingBlock(block);
                                                            setShowModal(true);
                                                        }}
                                                        className="absolute inset-1 p-2 rounded-lg text-left text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity overflow-hidden"
                                                        style={{
                                                            backgroundColor: block.work_type === "deep"
                                                                ? "#8b5cf6"
                                                                : "#f59e0b",
                                                            height: `calc(${block.duration_hours * 100}% - 8px)`
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {block.work_type === "deep" ? (
                                                                <Brain className="h-3 w-3" />
                                                            ) : (
                                                                <Zap className="h-3 w-3" />
                                                            )}
                                                            <span className="truncate">{block.title}</span>
                                                        </div>
                                                        <div className="text-white/70 mt-0.5">
                                                            {String(block.start_hour).padStart(2, '0')}:00 - {String(block.start_hour + block.duration_hours).padStart(2, '0')}:00
                                                        </div>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setNewBlockDay(dayIndex);
                                                            setNewBlockHour(hour);
                                                            setEditingBlock(null);
                                                            setShowModal(true);
                                                        }}
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
                    </CardContent>
                </Card>

                {/* Tips */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        <p className="text-sm text-foreground">
                            <strong>💡 Tip:</strong> Puedes planificar días pasados para registrar tu tiempo retroactivamente.
                            Los bloques morados son Deep Work y los amarillos son Shallow Work.
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
        </MainLayout>
    );
}
