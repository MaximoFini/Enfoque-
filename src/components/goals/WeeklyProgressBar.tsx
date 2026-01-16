"use client";

import * as React from "react";

interface WeeklyProgressBarProps {
    categoryName: string;
    emoji: string;
    currentHours: number;
    targetHours: number;
    color: string;
    daysRemaining: number;
}

export function WeeklyProgressBar({
    categoryName,
    emoji,
    currentHours,
    targetHours,
    color,
    daysRemaining,
}: WeeklyProgressBarProps) {
    const percentage = Math.min((currentHours / targetHours) * 100, 100);
    const hoursRemaining = Math.max(targetHours - currentHours, 0);
    const hoursPerDayNeeded = daysRemaining > 0 ? hoursRemaining / daysRemaining : 0;

    // Determine color based on percentage
    const getStatusColor = () => {
        if (percentage >= 80) return "bg-green-500";
        if (percentage >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getStatusGlow = () => {
        if (percentage >= 80) return "shadow-green-500/30";
        if (percentage >= 60) return "shadow-yellow-500/30";
        return "shadow-red-500/30";
    };

    const getStatusText = () => {
        if (percentage >= 100) return "✓ Meta cumplida";
        if (percentage >= 80) return "¡Vas muy bien!";
        if (percentage >= 60) return "Buen progreso";
        return "Necesitas más tiempo";
    };

    return (
        <div className="group p-4 rounded-2xl bg-secondary/50 hover:bg-secondary/70 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        {emoji}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{categoryName}</p>
                        <p className="text-xs text-muted-foreground">{getStatusText()}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                        {currentHours.toFixed(1)}h / {targetHours}h
                    </p>
                    <p className="text-xs text-muted-foreground">
                        ({percentage.toFixed(0)}%)
                    </p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-2">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getStatusColor()} shadow-lg ${getStatusGlow()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Hours needed indicator */}
            {hoursRemaining > 0 && daysRemaining > 0 && (
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        Faltan {hoursRemaining.toFixed(1)}h
                    </span>
                    <span className="font-medium text-primary">
                        → {hoursPerDayNeeded.toFixed(1)}h/día restante
                    </span>
                </div>
            )}
        </div>
    );
}
