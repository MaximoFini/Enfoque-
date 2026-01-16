"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Home,
    Calendar,
    BarChart3,
    TrendingUp,
    CheckSquare,
    CalendarDays,
    Trophy,
    Settings,
    X,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Star,
} from "lucide-react";

interface NavItem {
    href: string;
    label: string;
    emoji: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { href: "/hoy", label: "Hoy", emoji: "🏠", icon: Home },
    { href: "/semana", label: "Semana", emoji: "📅", icon: Calendar },
    { href: "/mes", label: "Mes", emoji: "📊", icon: BarChart3 },
    { href: "/anio", label: "Año", emoji: "📈", icon: TrendingUp },
    { href: "/tareas", label: "Tareas", emoji: "✅", icon: CheckSquare },
    { href: "/planificador", label: "Planificador", emoji: "🗓️", icon: CalendarDays },
    { href: "/retrospectiva", label: "Retrospectiva", emoji: "📝", icon: BookOpen },
    { href: "/progreso", label: "Progreso", emoji: "🏆", icon: Trophy },
    { href: "/niveles", label: "Niveles", emoji: "⭐", icon: Star },
    { href: "/configuracion", label: "Configuración", emoji: "⚙️", icon: Settings },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border",
                    "flex flex-col transition-all duration-300 ease-in-out",
                    "lg:translate-x-0 lg:static lg:z-auto",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    isCollapsed ? "lg:w-20" : "w-72"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
                    <div className={cn("flex items-center gap-3", isCollapsed && "lg:justify-center lg:w-full")}>
                        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">E</span>
                        </div>
                        {!isCollapsed && (
                            <span className="font-bold text-lg text-sidebar-foreground">Enfoque</span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                    >
                        <X className="h-5 w-5 text-sidebar-foreground" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href === "/hoy" && pathname === "/");
                            const Icon = item.icon;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                                            "transition-all duration-200 group",
                                            isActive
                                                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                            isCollapsed && "lg:justify-center lg:px-2"
                                        )}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <span className="text-lg">{item.emoji}</span>
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1">{item.label}</span>
                                                {isActive && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground" />
                                                )}
                                            </>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Collapse toggle button - only on desktop */}
                <div className="hidden lg:block p-3 border-t border-sidebar-border">
                    <button
                        onClick={onToggleCollapse}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <>
                                <ChevronLeft className="h-5 w-5" />
                                <span className="text-sm">Colapsar</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="p-4 border-t border-sidebar-border">
                        <div className="p-4 rounded-xl gradient-subtle">
                            <p className="text-xs text-muted-foreground mb-1">Versión Beta</p>
                            <p className="text-sm font-medium text-foreground">Enfoque App v0.1.0</p>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
