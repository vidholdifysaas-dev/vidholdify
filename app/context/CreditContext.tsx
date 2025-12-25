"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getUserCredits } from "@/app/actions/get-user-credits";

interface CreditData {
    // Plan tier
    planTier: string;
    // TopView (UGC) credits
    allowed: number;
    used: number;
    remaining: number;
    carryover: number;
    totalAvailable: number;
    // VEO3 (Manual Video) credits
    allowedVeo: number;
    usedVeo: number;
    remainingVeo: number;
    carryoverVeo: number;
    totalAvailableVeo: number;
}

interface CreditContextValue {
    credits: CreditData | null;
    loading: boolean;
    refreshCredits: () => Promise<void>;
}

const CreditContext = createContext<CreditContextValue | undefined>(undefined);

export function CreditProvider({ children }: { children: React.ReactNode }) {
    const [credits, setCredits] = useState<CreditData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshCredits = useCallback(async () => {
        try {
            console.log("🔄 Refreshing credits...");
            const data = await getUserCredits();
            if (data) {
                setCredits(data);
                console.log("✅ Credits refreshed:", data.totalAvailable, "UGC,", data.totalAvailableVeo, "VEO3");
            }
        } catch (error) {
            console.error("Failed to fetch credits", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        refreshCredits();
    }, [refreshCredits]);

    // Auto-refresh every 60 seconds as a fallback
    useEffect(() => {
        const intervalId = setInterval(refreshCredits, 60000);
        return () => clearInterval(intervalId);
    }, [refreshCredits]);

    return (
        <CreditContext.Provider value={{ credits, loading, refreshCredits }}>
            {children}
        </CreditContext.Provider>
    );
}

export function useCredits() {
    const context = useContext(CreditContext);
    if (context === undefined) {
        throw new Error("useCredits must be used within a CreditProvider");
    }
    return context;
}
