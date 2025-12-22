"use client";

import { useState, useEffect } from "react";
import {
    Loader2,
    Video,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    ExternalLink,
    RefreshCw,
    Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

// ============================================
// TYPES
// ============================================

interface VideoJob {
    id: string;
    status: string;
    productName: string;
    productDescription: string;
    platform: string;
    targetLength: string;
    referenceImageUrl?: string;
    finalVideoUrl?: string;
    sceneCount?: number;
    totalDuration?: number;
    errorMessage?: string;
    createdAt: string;
    completedAt?: string;
}

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<
        string,
        { color: string; bgColor: string; label: string; Icon: React.ComponentType<{ className?: string }> }
    > = {
        CREATED: {
            color: "text-blue-500",
            bgColor: "bg-blue-500/10 border-blue-500/20",
            label: "Created",
            Icon: Clock,
        },
        GENERATING_IMAGE: {
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10 border-yellow-500/20",
            label: "Generating Image",
            Icon: Loader2,
        },
        IMAGE_READY: {
            color: "text-yellow-500",
            bgColor: "bg-yellow-500/10 border-yellow-500/20",
            label: "Image Ready",
            Icon: Clock,
        },
        PLANNED: {
            color: "text-purple-500",
            bgColor: "bg-purple-500/10 border-purple-500/20",
            label: "Planned",
            Icon: Clock,
        },
        SCENES_GENERATING: {
            color: "text-orange-500",
            bgColor: "bg-orange-500/10 border-orange-500/20",
            label: "Generating Scenes",
            Icon: Loader2,
        },
        SCENES_READY: {
            color: "text-orange-500",
            bgColor: "bg-orange-500/10 border-orange-500/20",
            label: "Scenes Ready",
            Icon: Clock,
        },
        STITCHING: {
            color: "text-cyan-500",
            bgColor: "bg-cyan-500/10 border-cyan-500/20",
            label: "Stitching",
            Icon: Loader2,
        },
        DONE: {
            color: "text-green-500",
            bgColor: "bg-green-500/10 border-green-500/20",
            label: "Complete",
            Icon: CheckCircle2,
        },
        FAILED: {
            color: "text-red-500",
            bgColor: "bg-red-500/10 border-red-500/20",
            label: "Failed",
            Icon: XCircle,
        },
    };

    const config = statusConfig[status] || statusConfig.CREATED;
    const { Icon } = config;

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
                config.bgColor,
                config.color
            )}
        >
            <Icon
                className={cn(
                    "w-3 h-3",
                    (status === "GENERATING_IMAGE" ||
                        status === "SCENES_GENERATING" ||
                        status === "STITCHING") &&
                    "animate-spin"
                )}
            />
            {config.label}
        </div>
    );
}

// ============================================
// VIDEO CARD
// ============================================

function VideoCard({
    job,
    onView,
}: {
    job: VideoJob;
    onView: (job: VideoJob) => void;
}) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-brand-primary/30 transition-all hover:shadow-lg">
            {/* Thumbnail / Video Preview */}
            <div className="relative aspect-[9/16] bg-sidebar">
                {job.finalVideoUrl ? (
                    <video
                        src={job.finalVideoUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        poster={job.referenceImageUrl}
                        playsInline
                    />
                ) : job.referenceImageUrl && !imageError ? (
                    <Image
                        src={job.referenceImageUrl}
                        alt={job.productName}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                )}

                {/* Play Overlay */}
                {job.finalVideoUrl && (
                    <button
                        onClick={() => onView(job)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Play className="w-6 h-6 text-white ml-1" fill="white" />
                        </div>
                    </button>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    <StatusBadge status={job.status} />
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">
                        {job.productName}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {job.productDescription}
                    </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                    {job.targetLength && <span>{job.targetLength}s</span>}
                </div>

                {/* Actions */}
                {job.status === "DONE" && job.finalVideoUrl && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                        <a
                            href={job.finalVideoUrl}
                            download
                            className="flex-1 py-2 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium hover:bg-brand-primary/20 transition flex items-center justify-center gap-1"
                        >
                            <Download className="w-3 h-3" />
                            Download
                        </a>
                        <button
                            onClick={() => onView(job)}
                            className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {job.status === "FAILED" && job.errorMessage && (
                    <p className="text-xs text-red-500 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
                        {job.errorMessage}
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================
// VIDEO MODAL
// ============================================

function VideoModal({
    job,
    onClose,
}: {
    job: VideoJob;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-w-lg w-full bg-card rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Video */}
                {job.finalVideoUrl && (
                    <video
                        src={job.finalVideoUrl}
                        controls
                        autoPlay
                        className="w-full aspect-[9/16] max-h-[70vh] object-contain bg-black"
                    />
                )}

                {/* Info */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-semibold text-foreground">{job.productName}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Created{" "}
                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <a
                            href={job.finalVideoUrl}
                            download
                            className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ManualVideoHistory() {
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);

    // ==================
    // Fetch History
    // ==================
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/manual-video/list");
            if (response.data.success) {
                setJobs(response.data.jobs);
            } else {
                setError(response.data.error || "Failed to fetch history");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // ==================
    // Loading State
    // ==================
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto" />
                    <p className="text-muted-foreground">Loading history...</p>
                </div>
            </div>
        );
    }

    // ==================
    // Error State
    // ==================
    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={fetchHistory}
                        className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // ==================
    // Empty State
    // ==================
    if (jobs.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
                        <Video className="w-10 h-10 text-brand-primary/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No Videos Yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Create your first AI-generated video using the form on the left.
                    </p>
                </div>
            </div>
        );
    }

    // ==================
    // Main Render
    // ==================
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {jobs.map((job) => (
                    <VideoCard
                        key={job.id}
                        job={job}
                        onView={(job) => setSelectedJob(job)}
                    />
                ))}
            </div>

            {/* Video Modal */}
            {selectedJob && selectedJob.finalVideoUrl && (
                <VideoModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
        </>
    );
}
