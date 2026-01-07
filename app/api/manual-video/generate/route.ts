/**
 * Generate Video API Route (Full Pipeline)
 *
 * POST /api/manual-video/generate
 *
 * Complete video generation pipeline:
 * 1. Generate reference image (Nano Banana) - if not already done
 * 2. Generate script & dynamic scene plan (Gemini)
 *    - 15s → 2 scenes
 *    - 30s → 4 scenes
 *    - 45s → 6 scenes
 *    - 60s → 8 scenes
 * 3. Generate scene videos (Replicate Veo-3-fast)
 *    - SAME reference image for ALL scenes
 *    - Consistent avatar, background, lighting
 * 4. Upload scene videos to S3
 * 5. Invoke Lambda for FFmpeg merge with crossfades
 * 6. Return final video URL
 *
 * The final video looks like ONE continuous shot.
 *
 * INPUT: { jobId: string }
 * OUTPUT: { success: boolean, finalVideoUrl?: string, ... }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/configs/db";
import { videoJobs, scenes, VideoLength, Users } from "@/configs/schema";
import { eq, and } from "drizzle-orm";
import { generateScriptPlan, getSceneConfig } from "@/configs/ai-services/script-planner";
import {
    generateImage,
    pollUntilComplete,
    isConfigured as isNanoBananaConfigured,
} from "@/configs/ai-services/nano-banana";
import { uploadToS3, getS3Paths, getSignedUrlFromS3Url } from "@/configs/s3";
import {
    generateAllScenes,
    isReplicateConfigured,
} from "@/configs/ai-services/replicate-veo";
import axios from "axios";
import {
    invokeMergerLambdaAsync,
    getSceneS3Key,
    getFinalVideoS3Key,
    isLambdaMergerConfigured,
} from "@/configs/ai-services/lambda-merger";
import {
    getAvailableVeoCredits,
    deductVeoCredits,
    getVeoCreditsForDuration,
} from "@/utils/creditHelpers";
import { planLimits, PlanTier } from "@/dataUtils/planLimits";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes - Veo generation can take time

/**
 * Map image aspect ratio to Veo-supported format
 * Veo only supports 16:9 and 9:16, so we map other formats accordingly
 */
function getVeoAspectRatio(imageAspectRatio: string | null): "16:9" | "9:16" {
    // Default to 9:16 if not specified
    if (!imageAspectRatio) return "9:16";

    switch (imageAspectRatio) {
        case "16:9":
            return "16:9"; // Horizontal
        case "9:16":
        case "4:5":
        case "3:4":
            return "9:16"; // Vertical/portrait formats
        case "1:1":
            return "9:16"; // Square maps to vertical (common for social media)
        default:
            return "9:16"; // Default to vertical
    }
}

export async function POST(request: NextRequest) {
    let currentJobId = "unknown";
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { jobId, userScript } = body;
        currentJobId = jobId || "unknown";

        console.log(`[VideoJob] [${currentJobId}] Request received`);

        if (!jobId) {
            return NextResponse.json(
                { success: false, error: "jobId is required" },
                { status: 400 }
            );
        }

        // Fetch the job
        const [job] = await db
            .select()
            .from(videoJobs)
            .where(and(eq(videoJobs.id, jobId), eq(videoJobs.userId, userId)));

        if (!job) {
            console.warn(`[VideoJob] [${currentJobId}] Job not found or access denied`);
            return NextResponse.json(
                { success: false, error: "Job not found" },
                { status: 404 }
            );
        }

        // Store userScript if provided
        if (userScript && userScript.trim()) {
            await db
                .update(videoJobs)
                .set({ userScript: userScript.trim() })
                .where(eq(videoJobs.id, jobId));

            // Update local object
            job.userScript = userScript.trim();
        }

        // Update targetLength if provided (in case user changed it after Step 1)
        if (body.targetLength && ["15", "30", "45", "60"].includes(body.targetLength)) {
            if (job.targetLength !== body.targetLength) {
                console.log(`[VideoJob] [${currentJobId}] Updating targetLength: ${job.targetLength} -> ${body.targetLength}`);

                await db
                    .update(videoJobs)
                    .set({ targetLength: body.targetLength })
                    .where(eq(videoJobs.id, jobId));

                // Update local object
                job.targetLength = body.targetLength;
            }
        }

        // Validate job can be started (allow more statuses for resume/retry capability)
        // "FAILED" is included to allow users to retry after an error
        const validStatuses = ["CREATED", "PLANNED", "GENERATING_IMAGE", "PLANNING", "IMAGE_READY", "SCRIPT_READY", "SCENES_GENERATING", "FAILED"];
        if (!validStatuses.includes(job.status)) {
            console.warn(`[VideoJob] [${currentJobId}] Invalid job status: ${job.status}`);
            return NextResponse.json(
                {
                    success: false,
                    error: `Job cannot be processed from status: ${job.status}. Valid statuses are: ${validStatuses.join(", ")}`,
                },
                { status: 400 }
            );
        }

        console.log(`[VideoJob] [${currentJobId}] Status confirmed: ${job.status}. Starting processing...`);

        // Check required services
        if (!isReplicateConfigured()) {
            console.error(`[VideoJob] [${currentJobId}] Replicate API key missing`);
            return NextResponse.json(
                { success: false, error: "REPLICATE_API_KEY not configured" },
                { status: 500 }
            );
        }

        if (!isLambdaMergerConfigured()) {
            console.error(`[VideoJob] [${currentJobId}] Lambda merger not configured`);
            return NextResponse.json(
                { success: false, error: "Lambda merger not configured" },
                { status: 500 }
            );
        }

        // Get scene configuration for this duration
        const sceneConfig = getSceneConfig(job.targetLength as VideoLength);
        console.log(`[VideoJob] [${currentJobId}] Plan: ${job.targetLength}s -> ${sceneConfig.sceneCount} scenes`);

        // ========================================
        // CREDIT CHECK: Verify user has enough VEO3 credits
        // ========================================
        const targetDuration = parseInt(job.targetLength);
        const creditsRequired = getVeoCreditsForDuration(targetDuration);

        // Get user from database
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const userEmail = clerkUser.emailAddresses.find(
            (e: { id: string; emailAddress: string }) =>
                e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: "User email not found" },
                { status: 404 }
            );
        }

        const [user] = await db
            .select()
            .from(Users)
            .where(eq(Users.email, userEmail))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found in database" },
                { status: 404 }
            );
        }

        // Check max duration limit per plan
        const userPlan = (user.plan_tier || "free") as PlanTier;
        const planConfig = planLimits[userPlan] || planLimits.free;
        const maxDurationVeo = planConfig.maxDuration_veo;

        if (targetDuration > maxDurationVeo) {
            console.warn(`[VideoJob] [${currentJobId}] Plan limit exceeded: Requested ${targetDuration}s, Max ${maxDurationVeo}s`);
            return NextResponse.json(
                {
                    success: false,
                    error: `Your ${userPlan} plan allows maximum ${maxDurationVeo}s videos. Please upgrade to generate ${targetDuration}s videos.`,
                    maxDuration: maxDurationVeo,
                    requested: targetDuration,
                },
                { status: 402 }
            );
        }

        // Check VEO3 credits
        const availableCredits = getAvailableVeoCredits(user);
        if (availableCredits.available < creditsRequired) {
            console.warn(`[VideoJob] [${currentJobId}] Insufficient credits: Has ${availableCredits.available}, Needed ${creditsRequired}`);
            return NextResponse.json(
                {
                    success: false,
                    error: `Insufficient VEO3 credits. You need ${creditsRequired} credits for a ${targetDuration}s video, but only have ${availableCredits.available} available.`,
                    required: creditsRequired,
                    available: availableCredits.available,
                },
                { status: 402 }
            );
        }

        console.log(`[VideoJob] [${currentJobId}] Credit check passed: ${availableCredits.available} available`);

        // ========================================
        // STEP 1: Generate Reference Image (if needed)
        // ========================================
        let referenceImageUrl = job.referenceImageUrl;

        if (!referenceImageUrl && job.imagePrompt) {
            console.log(`[VideoJob] [${currentJobId}] Step 1: Generating reference image...`);

            await db
                .update(videoJobs)
                .set({ status: "GENERATING_IMAGE", updatedAt: new Date() })
                .where(eq(videoJobs.id, jobId));

            if (!isNanoBananaConfigured()) {
                throw new Error("Nano Banana API is not configured");
            }

            const imageResult = await generateImage({
                prompt: job.imagePrompt,
                avatarDescription: job.avatarDescription || undefined,
                // productDescription removed
                backgroundDescription: job.backgroundDescription || undefined,
                aspectRatio: "9:16",
                style: "photorealistic",
            });

            if (!imageResult.success) {
                throw new Error(`Image generation failed: ${imageResult.error}`);
            }

            // Poll if async
            if (imageResult.taskId && !imageResult.imageUrl) {
                await db
                    .update(videoJobs)
                    .set({
                        nanoBananaTaskId: imageResult.taskId,
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, jobId));

                console.log(`[VideoJob] [${currentJobId}] Polling image task: ${imageResult.taskId}`);
                const finalStatus = await pollUntilComplete(imageResult.taskId);

                if (finalStatus.status !== "completed" || !finalStatus.imageUrl) {
                    throw new Error(
                        `Image generation failed: ${finalStatus.error || "Unknown error"}`
                    );
                }

                referenceImageUrl = finalStatus.imageUrl;
            } else {
                referenceImageUrl = imageResult.imageUrl ?? null;
            }

            // Upload to our S3
            if (referenceImageUrl) {
                try {
                    console.log(`[VideoJob] [${currentJobId}] Optimizing image for S3...`);
                    const imageResponse = await axios.get(referenceImageUrl, {
                        responseType: "arraybuffer",
                    });
                    const imageBuffer = Buffer.from(imageResponse.data);
                    const s3Key = `${getS3Paths(jobId).reference}/reference.png`;
                    referenceImageUrl = await uploadToS3(s3Key, imageBuffer, "image/png");
                    console.log(`[VideoJob] [${currentJobId}] Reference image saved to S3`);
                } catch (uploadError) {
                    console.warn(`[VideoJob] [${currentJobId}] Failed to upload image to S3, using original URL`, uploadError);
                }
            }

            await db
                .update(videoJobs)
                .set({
                    status: "IMAGE_READY",
                    referenceImageUrl,
                    updatedAt: new Date(),
                })
                .where(eq(videoJobs.id, jobId));
        }

        if (!referenceImageUrl) {
            throw new Error("Reference image URL is required");
        }

        console.log(`[VideoJob] [${currentJobId}] Using reference image: ${referenceImageUrl}`);

        // Ensure the reference image URL is accessible to Veo (Sign if S3)
        let accessibleReferenceUrl = referenceImageUrl;
        if (referenceImageUrl && referenceImageUrl.includes("amazonaws.com") && !referenceImageUrl.includes("?")) {
            try {
                accessibleReferenceUrl = await getSignedUrlFromS3Url(referenceImageUrl, 3600); // 1 hour access
                console.log(`[VideoJob] [${currentJobId}] Reference image signed for external access`);
            } catch (signError) {
                console.warn(`[VideoJob] [${currentJobId}] Failed to sign S3 URL, attempting with original`, signError);
            }
        }

        // ========================================
        // STEP 2: Generate Script and Scene Plan
        // ========================================
        console.log(`[VideoJob] [${currentJobId}] Step 2: Generating script (Gemini)...`);

        const plan = await generateScriptPlan({
            productName: job.productName,
            // productDescription removed
            targetLength: job.targetLength as VideoLength,
            platform: job.platform || "TikTok",
            avatarDescription: job.avatarDescription || undefined,
            backgroundDescription: job.backgroundDescription || undefined,
            userScript: job.userScript || undefined,
        });

        console.log(`[VideoJob] [${currentJobId}] Script planned: ${plan.scenes.length} scenes`);

        // Create scene records
        const sceneRecords = plan.scenes.map((scene) => ({
            videoJobId: jobId,
            sceneIndex: scene.sceneIndex,
            plannedDuration: scene.duration,
            script: scene.script,
            visualPrompt: scene.visualPrompt,
            motionDescription: scene.motionDescription,
            veoStatus: "pending" as const,
        }));

        await db.insert(scenes).values(sceneRecords);

        await db
            .update(videoJobs)
            .set({
                status: "PLANNED",
                fullScript: plan.fullScript,
                sceneCount: plan.scenes.length,
                updatedAt: new Date(),
            })
            .where(eq(videoJobs.id, jobId));

        // ========================================
        // STEP 3: Generate ALL Scene Videos with Veo
        // ========================================
        console.log(`[VideoJob] [${currentJobId}] Step 3: Generating scenes (Replicate Veo)...`);

        await db
            .update(videoJobs)
            .set({ status: "SCENES_GENERATING", updatedAt: new Date() })
            .where(eq(videoJobs.id, jobId));

        // Generate all scenes using the SAME reference image (Signed URL)
        const veoResult = await generateAllScenes(
            accessibleReferenceUrl, // Use the signed/accessible URL
            plan.scenes.map((scene) => ({
                sceneIndex: scene.sceneIndex,
                script: scene.script, // ... rest matching original structure
                visualPrompt: scene.visualPrompt,
                motionDescription: scene.motionDescription,
                plannedDuration: scene.duration,
            })),
            job.productName,
            async (sceneIndex, status) => {
                // Update scene status in DB
                const [sceneRecord] = await db
                    .select()
                    .from(scenes)
                    .where(
                        and(
                            eq(scenes.videoJobId, jobId),
                            eq(scenes.sceneIndex, sceneIndex)
                        )
                    );

                if (sceneRecord) {
                    await db
                        .update(scenes)
                        .set({
                            veoStatus: status === "completed" ? "completed" : "generating",
                            updatedAt: new Date(),
                        })
                        .where(eq(scenes.id, sceneRecord.id));
                }
                console.log(`[VideoJob] [${currentJobId}] Scene ${sceneIndex + 1} status: ${status}`);
            },
            {
                // Pass consistency and video format options
                avatarDescription: job.avatarDescription || undefined,
                backgroundDescription: job.backgroundDescription || undefined,
                aspectRatio: getVeoAspectRatio(job.aspectRatio), // Use image aspect ratio for video
                resolution: "720p",
            }
        );

        if (!veoResult.success) {
            throw new Error(`Veo generation failed: ${veoResult.error}`);
        }

        console.log(`[VideoJob] [${currentJobId}] Step 3 Complete: All scenes generated successfully`);

        // ========================================
        // STEP 4: Prepare scenes for merging (Skip S3 Upload)
        // ========================================
        console.log(`[VideoJob] [${currentJobId}] Step 4: Preparing for merge (Direct URL pass-through)`);

        const videoClips: Array<{
            url: string; // Changed from s3Key to url
            s3Key?: string; // Optional if we skip upload
            sceneIndex: number;
            duration: number;
        }> = [];

        // Just update the DB with the Replicate URLs (already done in Step 3 callback, but good to ensure)
        for (const scene of veoResult.scenes) {
            // We use the direct Replicate URL to avoid 504 Gateway Timeouts on Vercel
            // caused by downloading/uploading large video files.

            videoClips.push({
                url: scene.videoUrl,
                s3Key: getSceneS3Key(jobId, scene.sceneIndex), // We still generate the key for reference/future
                sceneIndex: scene.sceneIndex,
                duration: scene.duration,
            });

            // Update scene record to ensure rawVideoUrl is set
            await db
                .update(scenes)
                .set({
                    rawVideoUrl: scene.videoUrl, // Use generic URL column
                    veoStatus: "completed",
                    updatedAt: new Date(),
                })
                .where(and(eq(scenes.videoJobId, jobId), eq(scenes.sceneIndex, scene.sceneIndex)));
        }

        await db
            .update(videoJobs)
            .set({ status: "SCENES_READY", updatedAt: new Date() })
            .where(eq(videoJobs.id, jobId));

        // ========================================
        // STEP 5: Invoke Lambda for FFmpeg Merge (ASYNC to avoid timeout)
        // ========================================
        console.log(`[VideoJob] [${currentJobId}] Step 5: Invoking Lambda Merger (Async)`);

        await db
            .update(videoJobs)
            .set({ status: "STITCHING", updatedAt: new Date() })
            .where(eq(videoJobs.id, jobId));

        const outputKey = getFinalVideoS3Key(jobId);

        // Use ASYNC invocation to avoid Vercel timeout
        // The Lambda will update the database when done (via webhook or direct DB update)
        const mergeResult = await invokeMergerLambdaAsync({
            jobId,
            clips: videoClips.map(c => ({
                s3Key: c.s3Key || c.url, // Fallback to URL if key missing
                url: c.url, // Pass the direct URL
                sceneIndex: c.sceneIndex,
                duration: c.duration,
                isUrl: true, // Signal to Lambda that this is a URL, not a key
            })),
            outputKey,
            crossfadeDuration: 0,
        });

        if (!mergeResult.success) {
            throw new Error(`Lambda async invocation failed: ${mergeResult.error}`);
        }

        console.log(`[VideoJob] [${currentJobId}] Lambda successfully invoked. RequestId: ${mergeResult.requestId}`);


        // ========================================
        // DEDUCT VEO3 CREDITS (Deduct now since scenes are generated)
        // ========================================
        try {
            const deductedCredits = deductVeoCredits(user, creditsRequired);

            await db
                .update(Users)
                .set({
                    credits_used_veo: deductedCredits.credits_used_veo,
                    carryover_veo: deductedCredits.carryover_veo,
                    updated_at: new Date(),
                })
                .where(eq(Users.email, userEmail));

            console.log(`[VideoJob] [${currentJobId}] 💳 Deducted ${creditsRequired} VEO3 credits`);
        } catch (creditError: unknown) {
            const err = creditError as Error;
            console.error(`[VideoJob] [${currentJobId}] ❌ Credit deduction failed:`, err.message);
            // Continue anyway since scenes were generated successfully
        }

        console.log(`[VideoJob] [${currentJobId}] Pipeline processing handed off to Lambda`);

        // Return immediately - Lambda will complete the job asynchronously
        // Frontend should poll the status endpoint to detect when STITCHING -> DONE
        return NextResponse.json({
            success: true,
            message: "Video scenes generated. Final merge in progress...",
            status: "STITCHING",
            jobId,
            plan: {
                fullScript: plan.fullScript,
                sceneCount: plan.scenes.length,
                totalDuration: plan.totalDuration,
            },
        });
    } catch (error) {
        console.error(`[VideoJob] [${currentJobId}] CRITICAL ERROR:`, error);

        // Mark job as failed
        if (currentJobId && currentJobId !== "unknown") {
            try {
                await db
                    .update(videoJobs)
                    .set({
                        status: "FAILED",
                        errorMessage:
                            error instanceof Error ? error.message : "Unknown error",
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, currentJobId));
                console.log(`[VideoJob] [${currentJobId}] Marked job as FAILED in DB`);
            } catch (dbError) {
                console.error("[VideoJob] Failed to update job status:", dbError);
            }
        }

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error ? error.message : "Failed to generate video",
            },
            { status: 500 }
        );
    }
}
