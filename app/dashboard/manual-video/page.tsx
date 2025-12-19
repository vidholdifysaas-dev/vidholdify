"use client";

import { useState } from "react";
import ManualVideoForm from "./_components/ManualVideoForm";
import ManualVideoStatus from "./_components/ManualVideoStatus";
import ManualVideoHistory from "./_components/ManualVideoHistory";
import { ManualVideoProvider } from "./_components/ManualVideoContext";

export default function ManualVideoPage() {
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"create" | "history">("create");

    return (
        <ManualVideoProvider>
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        Manual Video Generator
                    </h1>
                    <p className="text-muted-foreground">
                        Create AI-powered UGC videos with Nano Banana + Veo pipeline
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab("create")}
                        className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "create"
                            ? "text-brand-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Create New
                        {activeTab === "create" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-2 font-medium transition-colors relative ${activeTab === "history"
                            ? "text-brand-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        History
                        {activeTab === "history" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === "create" && (
                    <div className="w-full">
                        {activeJobId ? (
                            // Show status when a job is active
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                                <ManualVideoForm
                                    onJobCreated={(jobId) => setActiveJobId(jobId)}
                                    isProcessing={!!activeJobId}
                                />
                                <ManualVideoStatus
                                    jobId={activeJobId}
                                    onComplete={() => {
                                        // Optionally switch to history or show completion message
                                    }}
                                    onReset={() => setActiveJobId(null)}
                                />
                            </div>
                        ) : (
                            // Full width form when no job is active
                            <div className="w-full">
                                <ManualVideoForm
                                    onJobCreated={(jobId) => setActiveJobId(jobId)}
                                    isProcessing={false}
                                />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "history" && <ManualVideoHistory />}
            </div>
        </ManualVideoProvider>
    );
}
