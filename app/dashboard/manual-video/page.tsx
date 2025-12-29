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
                        VEO3 Video Generator
                    </h1>
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
