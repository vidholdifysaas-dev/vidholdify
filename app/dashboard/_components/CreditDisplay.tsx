"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getUserCredits } from "@/app/actions/get-user-credits";

interface CreditData {
    allowed: number;
    used: number;
    remaining: number;
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
            <div className="px-3 md:px-4 py-2 rounded-lg bg-sidebar-accent border border-border animate-pulse">
                <div className="h-4 w-24 bg-gray-200/20 rounded"></div>
            </div>
        );
    }

    if (!credits) {
        return null;
    }

    // Determine color based on remaining credits
    let colorClass = "text-green-500"; // Default (Healthy)

    if (credits.remaining === 0) {
        colorClass = "text-red-500";
    } else if (credits.remaining <= 5) {
        colorClass = "text-orange-500";
    }

    return (
        <div className="px-3 md:px-4 py-2 rounded-lg bg-sidebar-accent border border-border">
            <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${colorClass}`} />
                <span className="text-xs md:text-sm font-medium text-foreground">
                    <span className={colorClass}>{credits.remaining}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="hidden sm:inline">{credits.allowed} </span>
                    Credits
                </span>
            </div>
        </div>
    );
}
