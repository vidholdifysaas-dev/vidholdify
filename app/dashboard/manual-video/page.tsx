"use client";

import { useState } from "react";
import ManualVideoForm from "./_components/ManualVideoForm";
import { ManualVideoProvider } from "./_components/ManualVideoContext";

export default function ManualVideoPage() {
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    return (
        <ManualVideoProvider>
            <div className="w-full">
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
