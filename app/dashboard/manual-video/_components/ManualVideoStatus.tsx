"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    ImageIcon,
    FileText,
    Video,
    Scissors,
    Download,
    RefreshCw,
    ExternalLink,
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
    productDescription: string;
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
// STATUS STEPS
// ============================================

const STATUS_STEPS = [
    {
        status: "CREATED",
        label: "Job Created",
        description: "Starting video generation...",
        icon: Clock,
    },
    {
        status: "GENERATING_IMAGE",
        label: "Generating Image",
        description: "Creating reference image with Nano Banana",
        icon: ImageIcon,
    },
    {
        status: "IMAGE_READY",
        label: "Image Ready",
        description: "Reference image generated",
        icon: ImageIcon,
    },
    {
        status: "PLANNED",
        label: "Script Planned",
        description: "AI generated script and scenes",
        icon: FileText,
    },
    {
        status: "SCENES_GENERATING",
        label: "Generating Scenes",
        description: "Veo is creating video scenes",
        icon: Video,
    },
    {
        status: "SCENES_READY",
        label: "Scenes Ready",
        description: "All video scenes generated",
        icon: Video,
    },
    {
        status: "STITCHING",
        label: "Stitching Video",
        description: "FFmpeg is combining scenes",
        icon: Scissors,
    },
    {
        status: "DONE",
        label: "Complete",
        description: "Your video is ready!",
        icon: CheckCircle2,
    },
];

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
    // Get Current Step Index
    // ==================
    const getCurrentStepIndex = () => {
        if (!job) return 0;
        const index = STATUS_STEPS.findIndex((s) => s.status === job.status);
        return index >= 0 ? index : 0;
    };

    const currentStepIndex = getCurrentStepIndex();

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

    // ==================
    // Main Render
    // ==================
    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {job?.productName || "Video Generation"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {job?.status === "DONE" ? "Complete" : "Processing..."}
                    </p>
                </div>

                {job?.status !== "DONE" && job?.status !== "FAILED" && (
                    <div className="flex items-center gap-2 text-brand-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">In Progress</span>
                    </div>
                )}
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
                {STATUS_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isComplete = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isFailed = job?.status === "FAILED" && isCurrent;

                    return (
                        <div
                            key={step.status}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all",
                                isComplete && "bg-green-500/5 border border-green-500/20",
                                isCurrent && !isFailed && "bg-brand-primary/5 border border-brand-primary/20",
                                isFailed && "bg-red-500/5 border border-red-500/20",
                                !isComplete && !isCurrent && "opacity-40"
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    isComplete && "bg-green-500/20 text-green-500",
                                    isCurrent && !isFailed && "bg-brand-primary/20 text-brand-primary",
                                    isFailed && "bg-red-500/20 text-red-500",
                                    !isComplete && !isCurrent && "bg-border text-muted-foreground"
                                )}
                            >
                                {isComplete ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : isFailed ? (
                                    <XCircle className="w-4 h-4" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <StepIcon className="w-4 h-4" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        isComplete && "text-green-500",
                                        isCurrent && !isFailed && "text-brand-primary",
                                        isFailed && "text-red-500",
                                        !isComplete && !isCurrent && "text-muted-foreground"
                                    )}
                                >
                                    {step.label}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reference Image Preview */}
            {job?.referenceImageUrl && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-brand-primary" />
                        <p className="text-sm font-medium text-foreground">
                            Generated Reference Image
                        </p>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-border bg-black group">
                        {/* Image with gradient mask */}
                        <div className="relative aspect-[9/16] max-h-[400px]">
                            <img
                                src={job.referenceImageUrl}
                                alt="Generated Reference"
                                className="w-full h-full object-contain"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            {/* Info badge */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <span className="px-2 py-1 rounded-md bg-black/60 text-white text-xs backdrop-blur-sm">
                                    Avatar + Product
                                </span>
                                <a
                                    href={job.referenceImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded-md bg-brand-primary/90 text-white text-xs hover:bg-brand-primary transition"
                                >
                                    View Full
                                </a>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        This image is used as reference for all {job.sceneCount || "video"} scenes
                    </p>
                </div>
            )}

            {/* Script Preview */}
            {job?.fullScript && (
                <div className="space-y-2">
                    <button
                        onClick={() => setShowScript(!showScript)}
                        className="text-sm font-medium text-brand-primary hover:underline flex items-center gap-1"
                    >
                        {showScript ? "Hide" : "Show"} Generated Script
                    </button>
                    {showScript && (
                        <div className="p-4 rounded-xl bg-sidebar border border-border">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                {job.fullScript}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Final Video */}
            {job?.status === "DONE" && job?.finalVideoUrl && (
                <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border border-border bg-black">
                        <video
                            src={job.finalVideoUrl}
                            controls
                            className="w-full aspect-[9/16] max-h-[500px] object-contain"
                        />
                    </div>

                    <div className="flex gap-3">
                        <a
                            href={job.finalVideoUrl}
                            download
                            className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Video
                        </a>
                        <a
                            href={job.finalVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 rounded-xl border border-border text-foreground hover:bg-sidebar-accent transition flex items-center justify-center"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            )}

            {/* Reset Button */}
            {job?.status === "DONE" && (
                <button
                    onClick={onReset}
                    className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
                >
                    Create Another Video
                </button>
            )}
        </div>
    );
}
