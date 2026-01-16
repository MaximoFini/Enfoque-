"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { InterruptionTracker, ContextSwitchTracker } from "@/components/tracker/FloatingTrackers";

interface MainLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const pathname = usePathname();

    // Show floating trackers only on work-related pages
    const showTrackers = ["/hoy", "/planificador", "/tareas"].some(p => pathname?.startsWith(p));

    // Persist collapsed state
    React.useEffect(() => {
        const saved = localStorage.getItem("sidebar_collapsed");
        if (saved === "true") {
            setSidebarCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", String(newState));
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={toggleCollapse}
                />

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
                    {/* Header */}
                    <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

                    {/* Page content */}
                    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>

            {/* Floating Trackers */}
            <InterruptionTracker isVisible={showTrackers} />
            <ContextSwitchTracker isVisible={showTrackers} />
        </div>
    );
}
