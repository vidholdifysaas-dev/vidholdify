/**
 * Lambda Merge Callback API Route
 * 
 * POST /api/manual-video/merge-callback
 * 
 * This endpoint is called by the Lambda function when video merge completes.
 * It updates the job status and stores the final video URL.
 * 
 * SECURITY: Uses a shared secret to verify the request is from Lambda.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { videoJobs, generatedVideos } from "@/configs/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// Secret for Lambda authentication (set in Lambda env vars)
const LAMBDA_CALLBACK_SECRET = process.env.LAMBDA_CALLBACK_SECRET || "default-secret-change-me";

interface MergeCallbackPayload {
    jobId: string;
    success: boolean;
    finalVideoUrl?: string;
    finalVideoKey?: string;
    totalDuration?: number;
    error?: string;
    secret: string; // For authentication
}

export async function POST(request: NextRequest) {
    try {
        const body: MergeCallbackPayload = await request.json();

        console.log(`[Callback] Received merge callback for job: ${body.jobId}`);

        // Verify the secret
        if (body.secret !== LAMBDA_CALLBACK_SECRET) {
            console.error("[Callback] Invalid secret");
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!body.jobId) {
            return NextResponse.json(
                { success: false, error: "jobId is required" },
                { status: 400 }
            );
        }

        // Fetch the job
        const [job] = await db
            .select()
            .from(videoJobs)
            .where(eq(videoJobs.id, body.jobId));

        if (!job) {
            console.error(`[Callback] Job not found: ${body.jobId}`);
            return NextResponse.json(
                { success: false, error: "Job not found" },
                { status: 404 }
            );
        }

        if (body.success && body.finalVideoUrl) {
            // Merge succeeded
            console.log(`[Callback] Merge succeeded for job: ${body.jobId}`);
            console.log(`[Callback] Final video: ${body.finalVideoUrl}`);

            await db
                .update(videoJobs)
                .set({
                    status: "DONE",
                    finalVideoUrl: body.finalVideoUrl,
                    totalDuration: body.totalDuration ? Math.round(body.totalDuration) : null,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(videoJobs.id, body.jobId));

            // Add to generated_videos table
            await db.insert(generatedVideos).values({
                userId: job.userId,
                userEmail: job.userEmail,
                videoJobId: body.jobId,
                productName: job.productName,
                videoUrl: body.finalVideoUrl,
                thumbnailUrl: job.referenceImageUrl,
                duration: body.totalDuration ? Math.round(body.totalDuration) : 0,
                aspectRatio: job.aspectRatio || "9:16",
            });

            console.log(`[Callback] Job ${body.jobId} marked as DONE`);
        } else {
            // Merge failed
            console.error(`[Callback] Merge failed for job: ${body.jobId}`);
            console.error(`[Callback] Error: ${body.error}`);

            await db
                .update(videoJobs)
                .set({
                    status: "FAILED",
                    errorMessage: body.error || "Lambda merge failed",
                    failedAt: "STITCHING", // Which step failed
                    updatedAt: new Date(),
                })
                .where(eq(videoJobs.id, body.jobId));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Callback] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Callback failed",
            },
            { status: 500 }
        );
    }
}
