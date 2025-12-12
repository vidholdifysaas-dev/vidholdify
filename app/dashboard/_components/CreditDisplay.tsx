"use client";

import { useEffect, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { getUserCredits } from "@/app/actions/get-user-credits";

interface CreditData {
    allowed: number;
    used: number;
    remaining: number;
    carryover: number;
    totalAvailable: number;
}

export default function CreditDisplay() {
    const [credits, setCredits] = useState<CreditData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const data = await getUserCredits();
                if (data) {
                    setCredits(data);
                }
            } catch (error) {
                console.error("Failed to fetch credits", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCredits();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-sidebar-accent/80 to-sidebar-accent/40 border border-border/50 animate-pulse">
                <div className="h-4 w-28 bg-gray-200/20 rounded"></div>
            </div>
        );
    }

    if (!credits) {
        return null;
    }

    // Determine color based on total available credits
    const getStatusColor = () => {
        if (credits.totalAvailable === 0) return "text-red-400";
        if (credits.totalAvailable <= 5) return "text-orange-400";
        return "text-emerald-400";
    };

    return (
        <div className="flex items-center gap-3 px-3 md:px-4 py-2 rounded-xl bg-gradient-to-r from-sidebar-accent/80 to-sidebar-accent/40 border border-border/50 backdrop-blur-sm">
            {/* Main Credits */}
            <div className="flex items-center gap-1.5">
                <Sparkles className={`w-4 h-4 ${getStatusColor()}`} />
                <div className="flex items-baseline gap-1">
                    <span className={`text-sm md:text-base font-bold ${getStatusColor()}`}>
                        {credits.used}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                        / {credits.allowed}
                    </span>
                </div>
            </div>

            {/* Carryover Credits - Only show if > 0 */}
            {credits.carryover > 0 && (
                <>
                    <div className="w-px h-4 bg-border/60"></div>
                    <div className="flex items-center gap-1.5" title="Carryover credits from previous period">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs md:text-sm font-semibold text-purple-400">
                            +{credits.carryover}
                        </span>
                        <span className="text-xs text-purple-400/70 hidden md:inline">
                            carryover
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
