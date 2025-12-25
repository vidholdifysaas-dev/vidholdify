"use client";

import { Sparkles, Video, Zap } from "lucide-react";
import { useCredits } from "@/app/context/CreditContext";

// Helper to format plan name
const formatPlanName = (tier: string): string => {
    const names: Record<string, string> = {
        free: "Free Plan",
        starter: "Starter",
        professional: "Professional",
        business: "Business",
        scale: "Scale",
    };
    return names[tier] || "Free Plan";
};

// Helper to get plan badge color
const getPlanBadgeColor = (tier: string): string => {
    const colors: Record<string, string> = {
        free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
        starter: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        professional: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        business: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        scale: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    };
    return colors[tier] || colors.free;
};

export default function SidebarCredits() {
    const { credits, loading } = useCredits();

    if (loading) {
        return (
            <div className="px-4 py-4 border-t border-sidebar-border">
                {/* Shimmer loading skeleton */}
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-20 bg-sidebar-accent/40 rounded animate-pulse"></div>
                                <div className="h-5 w-10 bg-sidebar-accent/40 rounded animate-pulse"></div>
                            </div>
                            <div className="h-2 w-full bg-sidebar-accent/30 rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!credits) {
        return null;
    }

    return (
        <div className="px-4 py-4 border-t border-sidebar-border space-y-4">
            {/* Plan Badge */}
            <div className="flex items-center justify-center">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPlanBadgeColor(credits.planTier)}`}>
                    {formatPlanName(credits.planTier)}
                </span>
            </div>

            {/* TopView (UGC) Credits */}
            <CreditBar
                label="Create Video"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                allowed={credits.allowed}
                used={credits.used}
                remaining={credits.remaining}
                carryover={credits.carryover}
                totalAvailable={credits.totalAvailable}
                colorScheme="emerald"
            />

            {/* VEO3 (Manual Video) Credits */}
            <CreditBar
                label="Manual Video"
                icon={<Video className="w-3.5 h-3.5" />}
                allowed={credits.allowedVeo}
                used={credits.usedVeo}
                remaining={credits.remainingVeo}
                carryover={credits.carryoverVeo}
                totalAvailable={credits.totalAvailableVeo}
                colorScheme="purple"
            />
        </div>
    );
}

// Reusable Credit Bar Component
function CreditBar({
    label,
    icon,
    allowed,
    used,
    remaining,
    carryover,
    totalAvailable,
    colorScheme,
}: {
    label: string;
    icon: React.ReactNode;
    allowed: number;
    used: number;
    remaining: number;
    carryover: number;
    totalAvailable: number;
    colorScheme: "emerald" | "purple";
}) {
    // Calculate USAGE percentage
    const usagePercentage = allowed > 0
        ? Math.min((used / allowed) * 100, 100)
        : 0;

    // Colors based on scheme and usage
    const getProgressColor = () => {
        if (usagePercentage >= 90) return "from-red-500 to-red-600";
        if (usagePercentage >= 70) return "from-orange-500 to-orange-600";
        if (colorScheme === "purple") return "from-purple-500 to-violet-600";
        return "from-brand-primary to-purple-600";
    };

    const getTextColor = () => {
        if (totalAvailable === 0) return "text-red-400";
        if (totalAvailable <= 2) return "text-orange-400";
        if (colorScheme === "purple") return "text-purple-400";
        return "text-emerald-400";
    };

    const getIconBg = () => {
        if (colorScheme === "purple") return "bg-purple-500/20";
        return "bg-emerald-500/20";
    };

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded ${getIconBg()}`}>
                        <span className={getTextColor()}>{icon}</span>
                    </div>
                    <span className="text-xs font-medium text-sidebar-foreground/70">{label}</span>
                </div>
                <span className={`text-sm font-bold ${getTextColor()}`}>
                    {totalAvailable}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-sidebar-accent/50 rounded-full overflow-hidden relative">
                <div
                    className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500 relative overflow-hidden`}
                    style={{ width: `${usagePercentage}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer"></div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-sidebar-foreground/50">
                    {remaining} left
                </span>
                {carryover > 0 ? (
                    <div className="flex items-center gap-0.5" title="Carryover credits">
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-[10px] font-medium text-amber-400">
                            +{carryover}
                        </span>
                    </div>
                ) : (
                    <span className="text-[10px] text-sidebar-foreground/40">
                        {used}/{allowed}
                    </span>
                )}
            </div>
        </div>
    );
}
