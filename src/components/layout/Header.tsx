"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
    onMenuClick: () => void;
    title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2.5 rounded-xl bg-secondary hover:bg-accent transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-foreground" />
                    </button>

                    {title && (
                        <h1 className="text-xl font-semibold text-foreground hidden sm:block">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* User avatar placeholder */}
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                        <span className="text-white font-semibold text-sm">M</span>
                    </div>

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
