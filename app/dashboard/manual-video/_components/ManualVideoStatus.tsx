"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Loader2,
    XCircle,
    RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import axios from "axios";

// ============================================
// TYPES
// ============================================

interface JobStatus {
    id: string;
    status: string;
    productName: string;
    referenceImageUrl?: string;
    finalVideoUrl?: string;
    fullScript?: string;
    sceneCount?: number;
    totalDuration?: number;
    errorMessage?: string;
    failedAt?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

interface ManualVideoStatusProps {
    jobId: string;
    onComplete: () => void;
    onReset: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ManualVideoStatus({
    jobId,
    onComplete,
    onReset,
}: ManualVideoStatusProps) {
    const [job, setJob] = useState<JobStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showScript, setShowScript] = useState(false);

    // ==================
    // Fetch Job Status
    // ==================
    const fetchStatus = useCallback(async () => {
        try {
            const response = await axios.get(`/api/manual-video/status?jobId=${jobId}`);
            if (response.data.success) {
                setJob(response.data.job);

                if (response.data.job.status === "DONE") {
                    onComplete();
                }
            } else {
                setError(response.data.error || "Failed to fetch status");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch status");
        } finally {
            setLoading(false);
        }
    }, [jobId, onComplete]);

    // Poll for status updates
    useEffect(() => {
        fetchStatus();

        const interval = setInterval(() => {
            if (job?.status !== "DONE" && job?.status !== "FAILED") {
                fetchStatus();
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [fetchStatus, job?.status]);

    // ==================
    // Render Loading
    // ==================
    if (loading && !job) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading job status...</p>
                </div>
            </div>
        );
    }

    // ==================
    // Render Error
    // ==================
    if (error || job?.status === "FAILED") {
        return (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-red-500">Generation Failed</p>
                        <p className="text-sm text-red-400 mt-1">
                            {job?.errorMessage || error || "An error occurred"}
                        </p>
                        {job?.failedAt && (
                            <p className="text-xs text-red-400/70 mt-1">
                                Failed at: {job.failedAt}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={onReset}
                    className="w-full py-3 rounded-xl border border-border text-foreground hover:bg-sidebar-accent transition flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }
}
