"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { WeeklyProgressBar } from "./WeeklyProgressBar";
import { useWeeklyProgress } from "@/hooks/useWeeklyProgress";
import { Target, TrendingUp, RefreshCw } from "lucide-react";

interface WeeklyGoalsCardProps {
    title?: string;
    compact?: boolean;
}

export function WeeklyGoalsCard({
    title = "📊 Progreso Semanal",
    compact = false
}: WeeklyGoalsCardProps) {
    const {
        weeklyProgress,
        daysRemaining,
        totalWeeklyHours,
        totalWeeklyTarget,
        isLoading,
        error,
        refresh
    } = useWeeklyProgress();

    const totalPercentage = totalWeeklyTarget > 0
        ? (totalWeeklyHours / totalWeeklyTarget) * 100
        : 0;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="p-4 rounded-2xl bg-secondary/50">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-secondary" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-secondary rounded w-24 mb-2" />
                                            <div className="h-3 bg-secondary rounded w-16" />
                                        </div>
                                    </div>
                                    <div className="h-3 bg-secondary rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-destructive" />
                        Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                        <p className="text-destructive mb-3">{error}</p>
                        <button
                            onClick={refresh}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-sm font-medium transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (weeklyProgress.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription>Configura tus metas semanales</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-6 rounded-xl bg-secondary/50 border border-border/50 text-center">
                        <p className="text-muted-foreground mb-3">
                            No tienes metas configuradas
                        </p>
                        <a
                            href="/configuracion/metas-semanales"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            <Target className="h-4 w-4" />
                            Configurar metas
                        </a>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            {title}
                        </CardTitle>
                        <CardDescription>
                            {daysRemaining} día{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''} esta semana
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={refresh}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="Actualizar"
                        >
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                                {totalPercentage.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {totalWeeklyHours.toFixed(1)}h / {totalWeeklyTarget}h
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className={`space-y-3 ${compact ? 'max-h-64 overflow-y-auto' : ''}`}>
                    {weeklyProgress.map(progress => (
                        <WeeklyProgressBar
                            key={progress.categoryId}
                            categoryName={progress.categoryName}
                            emoji={progress.emoji}
                            currentHours={progress.currentHours}
                            targetHours={progress.targetHours}
                            color={progress.color}
                            daysRemaining={daysRemaining}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
