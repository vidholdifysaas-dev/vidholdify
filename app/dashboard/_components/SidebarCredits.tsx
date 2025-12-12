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

export default function SidebarCredits() {
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
            <div className="px-4 py-4 border-t border-sidebar-border">
                {/* Shimmer loading skeleton */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-16 bg-sidebar-accent/40 rounded animate-pulse"></div>
                        <div className="h-6 w-12 bg-sidebar-accent/40 rounded animate-pulse"></div>
                    </div>
                    <div className="h-2.5 w-full bg-sidebar-accent/30 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-3 w-20 bg-sidebar-accent/30 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-sidebar-accent/30 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!credits) {
        return null;
    }

    // Calculate USAGE percentage (empty when none used, full when all used)
    const usagePercentage = credits.allowed > 0
        ? Math.min((credits.used / credits.allowed) * 100, 100)
        : 0;

    // Determine color based on usage (more used = warmer colors)
    const getProgressColor = () => {
        if (usagePercentage >= 90) return "from-red-500 to-red-600";
        if (usagePercentage >= 70) return "from-orange-500 to-orange-600";
        return "from-brand-primary to-purple-600";
    };

    const getTextColor = () => {
        if (credits.totalAvailable === 0) return "text-red-400";
        if (credits.totalAvailable <= 5) return "text-orange-400";
        return "text-emerald-400";
    };

    return (
        <div className="px-4 py-4 border-t border-sidebar-border">
            {/* Header with Total */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${getTextColor()}`} />
                    <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">Credits</span>
                </div>
                <span className={`text-lg font-bold ${getTextColor()}`}>
                    {credits.totalAvailable}
                </span>
            </div>

            {/* Progress Bar with Shimmer */}
            <div className="h-2.5 w-full bg-sidebar-accent/50 rounded-full overflow-hidden relative">
                <div
                    className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500 relative overflow-hidden`}
                    style={{ width: `${usagePercentage}%` }}
                >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"></div>
                </div>
            </div>

            {/* Remaining & Carryover on same line */}
            <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-sidebar-foreground/60">
                    {credits.remaining} remaining
                </span>

                {credits.carryover > 0 ? (
                    <div className="flex items-center gap-1" title="Carryover credits from previous period">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">
                            +{credits.carryover} carryover
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-sidebar-foreground/40">
                        {credits.used}/{credits.allowed} used
                    </span>
                )}
            </div>
        </div>
    );
}
