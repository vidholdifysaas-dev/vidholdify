"use client";

import { useState } from "react";
import { Video, Calendar, Download, ExternalLink, RefreshCw, Play, X, AlertCircle } from "lucide-react";
// import { TopviewVideo } from "@/configs/schema"; // Removed to avoid strict dependency

// Unified Interface for both Old (TopView) and New (Manual) videos
export interface DashboardVideo {
    id: string;
    productName: string | null;
    videoUrl: string | null;
    videoCoverUrl: string | null;
    createdAt: Date | null;
    duration: string | null | undefined;
    status: string | null;
    type: "manual" | "legacy";
}

interface VideoGridProps {
    videos: DashboardVideo[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
    const [selectedVideo, setSelectedVideo] = useState<DashboardVideo | null>(null);
    const [activeTab, setActiveTab] = useState<"manual" | "legacy">("manual"); // Default to new videos

    const filteredVideos = videos.filter((v) => v.type === activeTab);

    // Calculate counts for tabs
    const manualCount = videos.filter(v => v.type === "manual").length;
    const legacyCount = videos.filter(v => v.type === "legacy").length;

    return (
        <>
            {/* TABS */}
            <div className="flex gap-4 border-b border-border mb-6">
                <button
                    onClick={() => setActiveTab("manual")}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === "manual"
                        ? "text-brand-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Manual Videos
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-sidebar-accent text-xs">
                        {manualCount}
                    </span>
                    {activeTab === "manual" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("legacy")}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === "legacy"
                        ? "text-brand-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Created Videos
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-sidebar-accent text-xs">
                        {legacyCount}
                    </span>
                    {activeTab === "legacy" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                    )}
                </button>
            </div>

            {/* DATA RETENTION NOTICE - Only show if there are videos */}
            {filteredVideos.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="text-yellow-200 font-medium">
                            Please download your videos!
                        </p>
                        <p className="text-yellow-300/80 mt-1">
                            We store your data for 2 days only. Make sure to download your videos before they are automatically deleted.
                        </p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border rounded-xl flex flex-col items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <h3 className="font-medium text-lg text-foreground mb-1">
                            No {activeTab === "manual" ? "Manual" : "Created"} Videos
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {activeTab === "manual"
                                ? "You haven't created any manual AI videos yet."
                                : "You haven't created any standard videos yet."}
                        </p>
                        <a
                            href={activeTab === "manual" ? "/dashboard/manual-video" : "/dashboard/create"}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-all text-sm flex items-center gap-2"
                        >
                            <Video className="w-4 h-4" />
                            Create New Video
                        </a>
                    </div>
                ) : (
                    filteredVideos.map((video) => (
                        <div
                            key={video.id}
                            className="group rounded-xl bg-card border border-border overflow-hidden hover:border-brand-primary/50 transition-all shadow-sm hover:shadow-md"
                        >
                            {/* Thumbnail / Video Preview - REDUCED HEIGHT */}
                            {/* Changed from aspect-[9/16] to h-[280px] or aspect-[3/4] as requested to reduce height */}
                            <div className="h-[250px] relative bg-sidebar-accent group-hover:bg-sidebar-accent/80 transition-colors w-full">
                                {video.videoCoverUrl ? (
                                    <img
                                        src={video.videoCoverUrl}
                                        alt={video.productName || "Video thumbnail"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                        <Video className="w-12 h-12 text-muted-foreground/50 mb-2" />
                                        {video.status === "processing" && (
                                            <span className="text-xs font-medium text-brand-primary animate-pulse">
                                                Generating...
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Overlay Status Badge */}
                                <div className="absolute top-3 right-3">
                                    {video.status === "completed" && (
                                        <div className="px-2 py-1 rounded-md bg-green-500/90 text-white text-xs font-medium backdrop-blur-sm shadow-sm">
                                            Completed
                                        </div>
                                    )}
                                    {(video.status === "processing" || video.status === "pending") && (
                                        <div className="px-2 py-1 rounded-md bg-amber-500/90 text-white text-xs font-medium backdrop-blur-sm shadow-sm flex items-center gap-1">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            Processing
                                        </div>
                                    )}
                                    {video.status === "failed" && (
                                        <div className="px-2 py-1 rounded-md bg-red-500/90 text-white text-xs font-medium backdrop-blur-sm shadow-sm">
                                            Failed
                                        </div>
                                    )}
                                </div>

                                {/* Play Overlay Button for Completed Videos */}
                                {video.status === "completed" && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                        <button
                                            onClick={() => setSelectedVideo(video)}
                                            className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-all transform hover:scale-110"
                                        >
                                            <Play className="w-8 h-8 text-white fill-white" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h3
                                        className="font-semibold text-foreground truncate"
                                        title={video.productName || "Untitled Video"}
                                    >
                                        {video.productName || "Untitled Video"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Calendar className="w-3 h-3" />
                                        {video.createdAt
                                            ? new Date(video.createdAt).toLocaleDateString()
                                            : "Unknown date"}
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-2 py-2 border-t border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                            Duration
                                        </span>
                                        <span className="text-xs font-medium text-foreground">
                                            {video.duration || "--:--"}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex items-center gap-2">
                                    {video.status === "completed" && video.videoUrl ? (
                                        <>
                                            <button
                                                onClick={() => setSelectedVideo(video)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition-all cursor-pointer"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                View
                                            </button>
                                            <a
                                                href={video.videoUrl}
                                                download
                                                className="flex items-center justify-center p-2 rounded-lg bg-sidebar-accent text-sidebar-foreground border border-sidebar-border hover:bg-sidebar-accent/80 transition-all"
                                                title="Download"
                                            >
                                                <Download className="w-3 h-3" />
                                            </a>
                                        </>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-muted-foreground text-xs font-medium opacity-50 cursor-not-allowed"
                                        >
                                            {video.status === "failed"
                                                ? "Generation Failed"
                                                : "Processing..."}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedVideo(null)}
                >
                    <div
                        className="relative bg-card w-full max-w-sm md:max-w-md max-h-[80vh] rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-border flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-3 right-3 z-10">
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 bg-black flex items-center justify-center min-h-0 overflow-hidden">
                            {selectedVideo.videoUrl ? (
                                <video
                                    src={selectedVideo.videoUrl}
                                    controls
                                    autoPlay
                                    className="h-full w-auto object-contain"
                                />
                            ) : (
                                <div className="p-12 text-center text-white">
                                    <p>Video URL not available</p>
                                </div>
                            )}
                        </div>

                        {/* Footer with details */}
                        <div className="bg-card p-3 border-t border-border flex justify-between items-center shrink-0">
                            <div className="overflow-hidden mr-4">
                                <h3 className="font-semibold text-foreground text-sm truncate">{selectedVideo.productName}</h3>
                                <p className="text-xs text-muted-foreground">{selectedVideo.createdAt ? new Date(selectedVideo.createdAt).toLocaleDateString() : ''}</p>
                            </div>
                            <a
                                href={selectedVideo.videoUrl || '#'}
                                download
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-all text-xs font-medium shrink-0"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
