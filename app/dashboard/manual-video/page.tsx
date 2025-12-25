"use client";

import { useState } from "react";
import ManualVideoForm from "./_components/ManualVideoForm";
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

                {/* Content - Always full width */}
                <div className="w-full">
                    <ManualVideoForm
                        onJobCreated={(jobId) => setActiveJobId(jobId)}
                        isProcessing={!!activeJobId}
                    />
                </div>
            </div>
        </ManualVideoProvider>
    );
}
