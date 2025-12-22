"use client";

import { useState } from "react";
import ManualVideoForm from "./_components/ManualVideoForm";
import ManualVideoStatus from "./_components/ManualVideoStatus";
import { ManualVideoProvider } from "./_components/ManualVideoContext";

export default function ManualVideoPage() {
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

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

                {/* Content */}
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
            </div>
        </ManualVideoProvider>
    );
}
