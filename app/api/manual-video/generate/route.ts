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
 *    - 45s → 5 scenes
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
import { videoJobs, scenes, VideoLength, generatedVideos, Users } from "@/configs/schema";
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
    invokeMergerLambda,
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
                console.log(`[API] Updating job targetLength: ${job.targetLength} -> ${body.targetLength}`);

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
            console.log(`[API] Job ${jobId} has status: ${job.status} - cannot process`);
            return NextResponse.json(
                {
                    success: false,
                    error: `Job cannot be processed from status: ${job.status}. Valid statuses are: ${validStatuses.join(", ")}`,
                },
                { status: 400 }
            );
        }

        console.log(`[API] Job ${jobId} found with status: ${job.status}`);

        // Check required services
        if (!isReplicateConfigured()) {
            return NextResponse.json(
                { success: false, error: "REPLICATE_API_KEY not configured" },
                { status: 500 }
            );
        }

        if (!isLambdaMergerConfigured()) {
            return NextResponse.json(
                { success: false, error: "Lambda merger not configured" },
                { status: 500 }
            );
        }

        // Get scene configuration for this duration
        const sceneConfig = getSceneConfig(job.targetLength as VideoLength);
        console.log(`[API] ========================================`);
        console.log(`[API] Starting video generation for job: ${jobId}`);
        console.log(`[API] Duration: ${job.targetLength}s → ${sceneConfig.sceneCount} scenes`);
        console.log(`[API] ========================================`);

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

        console.log(`[API] Credit check passed: ${creditsRequired} credits required, ${availableCredits.available} available`);

        // ========================================
        // STEP 1: Generate Reference Image (if needed)
        // ========================================
        let referenceImageUrl = job.referenceImageUrl;

        if (!referenceImageUrl && job.imagePrompt) {
            console.log("[API] Step 1: Generating reference image...");

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
                productDescription: job.productDescription,
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
                    const imageResponse = await axios.get(referenceImageUrl, {
                        responseType: "arraybuffer",
                    });
                    const imageBuffer = Buffer.from(imageResponse.data);
                    const s3Key = `${getS3Paths(jobId).reference}/reference.png`;
                    referenceImageUrl = await uploadToS3(s3Key, imageBuffer, "image/png");
                    console.log(`[API] Reference image uploaded to S3`);
                } catch (uploadError) {
                    console.warn("[API] Failed to re-upload image to S3, using original URL", uploadError);
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

        console.log(`[API] Using reference image: ${referenceImageUrl}`);

        // Ensure the reference image URL is accessible to Veo (Sign if S3)
        let accessibleReferenceUrl = referenceImageUrl;
        if (referenceImageUrl && referenceImageUrl.includes("amazonaws.com") && !referenceImageUrl.includes("?")) {
            try {
                accessibleReferenceUrl = await getSignedUrlFromS3Url(referenceImageUrl, 3600); // 1 hour access
                console.log(`[API] Signed reference image for Veo access`);
            } catch (signError) {
                console.warn("[API] Failed to sign reference URL, trying original:", signError);
            }
        }

        // ========================================
        // STEP 2: Generate Script and Scene Plan
        // ========================================
        console.log("[API] Step 2: Generating script and scene plan...");
        console.log(`[API] Target: ${job.targetLength}s video with ${sceneConfig.sceneCount} scenes`);

        const plan = await generateScriptPlan({
            productName: job.productName,
            productDescription: job.productDescription,
            targetLength: job.targetLength as VideoLength,
            platform: job.platform || "TikTok",
            avatarDescription: job.avatarDescription || undefined,
            backgroundDescription: job.backgroundDescription || undefined,
            userScript: job.userScript || undefined,
        });

        console.log(`[API] Generated plan: ${plan.scenes.length} scenes, ${plan.totalDuration}s total`);

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
        console.log("[API] Step 3: Generating scene videos with Veo...");
        console.log(`[API] SAME reference image for all ${plan.scenes.length} scenes (consistency)`);

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

        console.log(`[API] All ${veoResult.scenes.length} scenes generated`);

        // ========================================
        // STEP 4: Upload Scene Videos to S3
        // ========================================
        console.log("[API] Step 4: Uploading scene videos to S3...");

        const s3Clips: Array<{
            s3Key: string;
            sceneIndex: number;
            duration: number;
        }> = [];

        for (const scene of veoResult.scenes) {
            console.log(`[API] Uploading scene ${scene.sceneIndex + 1}/${veoResult.scenes.length}`);

            // Download video from Replicate using axios
            const videoResponse = await axios.get(scene.videoUrl, {
                responseType: "arraybuffer",
            });

            const videoBuffer = Buffer.from(videoResponse.data);
            const s3Key = getSceneS3Key(jobId, scene.sceneIndex);

            // Upload to S3
            const s3Url = await uploadToS3(s3Key, videoBuffer, "video/mp4");
            console.log(`[API] Scene ${scene.sceneIndex + 1} uploaded: ${s3Key}`);

            // Update scene record
            const [sceneRecord] = await db
                .select()
                .from(scenes)
                .where(
                    and(
                        eq(scenes.videoJobId, jobId),
                        eq(scenes.sceneIndex, scene.sceneIndex)
                    )
                );

            if (sceneRecord) {
                await db
                    .update(scenes)
                    .set({
                        rawVideoUrl: s3Url,
                        veoStatus: "completed",
                        updatedAt: new Date(),
                    })
                    .where(eq(scenes.id, sceneRecord.id));
            }

            s3Clips.push({
                s3Key,
                sceneIndex: scene.sceneIndex,
                duration: scene.duration,
            });
        }

        await db
            .update(videoJobs)
            .set({ status: "SCENES_READY", updatedAt: new Date() })
            .where(eq(videoJobs.id, jobId));

        console.log(`[API] All ${s3Clips.length} scenes uploaded to S3`);

        // ========================================
        // STEP 5: Invoke Lambda for FFmpeg Merge
        // ========================================
        console.log("[API] Step 5: Invoking Lambda for FFmpeg merge...");
        console.log(`[API] Merging ${s3Clips.length} scenes with crossfades`);

        await db
            .update(videoJobs)
            .set({ status: "STITCHING", updatedAt: new Date() })
            .where(eq(videoJobs.id, jobId));

        const outputKey = getFinalVideoS3Key(jobId);

        const mergeResult = await invokeMergerLambda({
            jobId,
            clips: s3Clips.sort((a, b) => a.sceneIndex - b.sceneIndex),
            outputKey,
            crossfadeDuration: 0, // Hard cut for seamless "jump cut" style (no ghosting)
        });

        if (!mergeResult.success || !mergeResult.finalVideoUrl) {
            throw new Error(`Lambda merge failed: ${mergeResult.error}`);
        }

        console.log(`[API] Final video merged: ${mergeResult.finalVideoUrl}`);

        // ========================================
        // STEP 6: Complete Job
        // ========================================
        const finalDuration = mergeResult.totalDuration || veoResult.totalDuration || plan.totalDuration;

        await db
            .update(videoJobs)
            .set({
                status: "DONE",
                finalVideoUrl: mergeResult.finalVideoUrl,
                totalDuration: Math.round(finalDuration),
                completedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(videoJobs.id, jobId));

        // Also add to the generated_videos table for clean record keeping
        await db.insert(generatedVideos).values({
            userId,
            userEmail: job.userEmail,
            videoJobId: jobId,
            productName: job.productName,
            productDescription: job.productDescription,
            videoUrl: mergeResult.finalVideoUrl,
            thumbnailUrl: job.referenceImageUrl, // Use the reference image as thumbnail
            duration: Math.round(finalDuration),
            aspectRatio: job.aspectRatio || "9:16",
        });

        // ========================================
        // DEDUCT VEO3 CREDITS
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

            console.log(`[API] 💳 Deducted ${creditsRequired} VEO3 credits from user: ${userEmail}`);
        } catch (creditError: unknown) {
            const err = creditError as Error;
            console.error(`[API] ❌ Failed to deduct VEO3 credits:`, err.message);
            // Continue anyway since video was generated successfully
        }

        console.log(`[API] ========================================`);
        console.log(`[API] Job ${jobId} COMPLETED SUCCESSFULLY`);
        console.log(`[API] Final video: ${mergeResult.finalVideoUrl}`);
        console.log(`[API] Duration: ~${Math.round(finalDuration)}s`);
        console.log(`[API] ========================================`);

        return NextResponse.json({
            success: true,
            message: "Video generated successfully",
            finalVideoUrl: mergeResult.finalVideoUrl,
            plan: {
                fullScript: plan.fullScript,
                sceneCount: plan.scenes.length,
                totalDuration: Math.round(finalDuration),
            },
        });
    } catch (error) {
        console.error("[API] Generate video error:", error);

        // Mark job as failed
        const body = await request.clone().json().catch(() => ({}));
        if (body.jobId) {
            try {
                await db
                    .update(videoJobs)
                    .set({
                        status: "FAILED",
                        errorMessage:
                            error instanceof Error ? error.message : "Unknown error",
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, body.jobId));
            } catch (dbError) {
                console.error("[API] Failed to update job status:", dbError);
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
