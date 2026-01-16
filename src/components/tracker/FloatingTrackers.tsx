"use client";

import * as React from "react";
import { AlertCircle, X, Zap } from "lucide-react";
import { getCurrentUserId } from "@/lib/supabase/services";
import { getSupabaseClient } from "@/lib/supabase/client";

interface InterruptionTrackerProps {
    isVisible: boolean;
}

export function InterruptionTracker({ isVisible }: InterruptionTrackerProps) {
    const [todayCount, setTodayCount] = React.useState(0);
    const [todayLostMinutes, setTodayLostMinutes] = React.useState(0);
    const [showToast, setShowToast] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Load today's interruptions
    React.useEffect(() => {
        if (!isVisible) return;

        async function loadData() {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const supabase = getSupabaseClient();
            if (!supabase) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data } = await supabase
                .from("interruptions")
                .select("*")
                .eq("user_id", userId)
                .gte("logged_at", today.toISOString());

            if (data) {
                setTodayCount(data.length);
                setTodayLostMinutes(data.reduce((sum, i) => sum + (i.estimated_lost_minutes || 5), 0));
            }
        }

        loadData();
    }, [isVisible]);

    const logInterruption = async () => {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        await supabase.from("interruptions").insert({
            user_id: userId,
            estimated_lost_minutes: 5,
        });

        setTodayCount(prev => prev + 1);
        setTodayLostMinutes(prev => prev + 5);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Floating button */}
            <div className="fixed bottom-6 right-6 z-40">
                {isExpanded ? (
                    <div className="bg-card border border-border rounded-2xl shadow-xl p-4 w-64 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-foreground">Interrupciones</h4>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-secondary rounded-lg"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-red-500/10 text-center">
                                <p className="text-2xl font-bold text-red-500">{todayCount}</p>
                                <p className="text-xs text-muted-foreground">Hoy</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-500/10 text-center">
                                <p className="text-2xl font-bold text-orange-500">{todayLostMinutes}m</p>
                                <p className="text-xs text-muted-foreground">Perdidos</p>
                            </div>
                        </div>

                        <button
                            onClick={logInterruption}
                            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <AlertCircle className="h-5 w-5" />
                            Registrar Interrupción
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all flex items-center justify-center relative"
                        title="Registrar interrupción"
                    >
                        <AlertCircle className="h-6 w-6" />
                        {todayCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-red-500 text-xs font-bold flex items-center justify-center">
                                {todayCount}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Toast notification */}
            {showToast && (
                <div className="fixed bottom-24 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg animate-in slide-in-from-right-2">
                    ⚠️ Interrupción registrada (+5 min perdidos)
                </div>
            )}
        </>
    );
}

interface ContextSwitchTrackerProps {
    isVisible: boolean;
}

export function ContextSwitchTracker({ isVisible }: ContextSwitchTrackerProps) {
    const [todayCount, setTodayCount] = React.useState(0);
    const [showToast, setShowToast] = React.useState(false);

    // Load today's switches
    React.useEffect(() => {
        if (!isVisible) return;

        async function loadData() {
            const userId = await getCurrentUserId();
            if (!userId) return;

            const supabase = getSupabaseClient();
            if (!supabase) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data } = await supabase
                .from("context_switches")
                .select("*")
                .eq("user_id", userId)
                .gte("switched_at", today.toISOString());

            if (data) {
                setTodayCount(data.length);
            }
        }

        loadData();
    }, [isVisible]);

    const logSwitch = async () => {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        await supabase.from("context_switches").insert({
            user_id: userId,
        });

        setTodayCount(prev => prev + 1);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Floating button - positioned above interruption tracker */}
            <div className="fixed bottom-24 right-6 z-40">
                <button
                    onClick={logSwitch}
                    className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg transition-all flex items-center justify-center relative"
                    title="Cambio de contexto"
                >
                    <Zap className="h-5 w-5" />
                    {todayCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-yellow-600 text-xs font-bold flex items-center justify-center">
                            {todayCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Toast notification */}
            {showToast && (
                <div className="fixed bottom-40 right-6 z-50 bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg animate-in slide-in-from-right-2">
                    ⚡ Cambio de contexto registrado
                </div>
            )}
        </>
    );
}
