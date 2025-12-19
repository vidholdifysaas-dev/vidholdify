/**
 * Create Video Job API Route
 * 
 * POST /api/manual-video/create
 * 
 * Creates a new video generation job with Nano Banana + Veo pipeline.
 * 
 * If `generateImageOnly: true`, it will:
 * 1. Create the job
 * 2. Start generating the reference image (async)
 * 3. Return immediately with jobId
 * 
 * Client should poll /api/manual-video/status to get the generated image URL.
 * 
 * INPUT:
 * {
 *   productName: string (required) - Name of the product
 *   productDescription: string (required) - Description of the product
 *   targetLength: "15" | "30" | "45" (required) - Video length in seconds
 *   platform: "tiktok" | "instagram_reels" | "youtube_shorts" | "general" (optional)
 *   avatarDescription: string (optional) - Description of the person/avatar
 *   avatarImageUrl: string (optional) - URL of uploaded avatar image
 *   productImageUrl: string (optional) - URL of uploaded product image
 *   productHoldingDescription: string (optional) - How they hold the product
 *   backgroundDescription: string (optional) - Background/scene description
 *   imagePrompt: string (optional) - Full custom prompt for Nano Banana
 *   generateImageOnly: boolean (optional) - If true, only generate reference image
 * }
 * 
 * OUTPUT:
 * {
 *   success: boolean,
 *   jobId: string - UUID of the created job
 *   referenceImageUrl?: string - If image already generated (sync)
 *   message: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSignedUrlFromS3Url } from "@/configs/s3";
import { db } from "@/configs/db";
import { videoJobs, VideoLength, VideoPlatform } from "@/configs/schema";
import {
    buildImagePrompt,
    generateImage,
    pollUntilComplete,
    isConfigured as isNanoBananaConfigured,
} from "@/configs/ai-services/nano-banana";
import { uploadToS3, getS3Paths, getSignedPlaybackUrl } from "@/configs/s3";
import { randomUUID } from "crypto";
import axios from "axios";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes to allow for image generation

// Validation types
interface CreateJobRequest {
    productName: string;
    productDescription: string;
    targetLength: VideoLength;
    platform?: VideoPlatform;
    avatarDescription?: string;
    avatarImageUrl?: string;
    productImageUrl?: string;
    productHoldingDescription?: string;
    backgroundDescription?: string;
    imagePrompt?: string;
    generateImageOnly?: boolean; // New: Only generate reference image in Step 1
    aspectRatio?: string; // Image aspect ratio (9:16, 1:1, 16:9, etc.)
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

        const body: CreateJobRequest = await request.json();

        // Validate required fields
        if (!body.productName || body.productName.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: "Product name is required (min 2 characters)" },
                { status: 400 }
            );
        }

        if (!body.productDescription || body.productDescription.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: "Product description is required (min 10 characters)" },
                { status: 400 }
            );
        }

        if (!["15", "30", "45"].includes(body.targetLength)) {
            return NextResponse.json(
                { success: false, error: "Target length must be 15, 30, or 45 seconds" },
                { status: 400 }
            );
        }

        // Generate job ID
        const jobId = randomUUID();

        // Build image prompt if not provided
        // Include flags for uploaded images so prompt is tailored appropriately
        const imagePrompt = body.imagePrompt || buildImagePrompt({
            productName: body.productName,
            productDescription: body.productDescription,
            avatarDescription: body.avatarDescription,
            productHoldingDescription: body.productHoldingDescription,
            backgroundDescription: body.backgroundDescription,
            platform: body.platform || "tiktok",
            hasAvatarImage: !!body.avatarImageUrl,
            hasProductImage: !!body.productImageUrl,
            aspectRatio: body.aspectRatio || "9:16",
        });

        // Create the job in the database
        const [job] = await db
            .insert(videoJobs)
            .values({
                id: jobId,
                userId,
                status: "CREATED",
                productName: body.productName.trim(),
                productDescription: body.productDescription.trim(),
                targetLength: body.targetLength,
                platform: body.platform || "tiktok",
                avatarDescription: body.avatarDescription?.trim(),
                avatarImageUrl: body.avatarImageUrl,
                productImageUrl: body.productImageUrl,
                productHoldingDescription: body.productHoldingDescription?.trim(),
                backgroundDescription: body.backgroundDescription?.trim(),
                imagePrompt,
                aspectRatio: body.aspectRatio || "9:16", // Store aspect ratio for video
            })
            .returning();

        console.log(`[API] Created video job: ${jobId}`);

        // If generateImageOnly is true, generate the reference image now
        if (body.generateImageOnly) {
            console.log(`[API] Generating reference image for job: ${jobId}`);

            // Update status
            await db
                .update(videoJobs)
                .set({ status: "GENERATING_IMAGE", updatedAt: new Date() })
                .where(eq(videoJobs.id, jobId));

            // Check if Nano Banana is configured
            if (!isNanoBananaConfigured()) {
                await db
                    .update(videoJobs)
                    .set({
                        status: "FAILED",
                        errorMessage: "Nano Banana API is not configured",
                        failedAt: "GENERATING_IMAGE",
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, jobId));

                return NextResponse.json({
                    success: false,
                    jobId: job.id,
                    error: "Image generation service is not configured",
                });
            }

            try {
                // Ensure S3 URLs are accessible by Replicate (generate signed URLs)
                // Private S3 URLs (default) will be rejected by Replicate, causing it to ignore inputs
                let signedAvatarUrl = body.avatarImageUrl;
                let signedProductUrl = body.productImageUrl;

                if (signedAvatarUrl && signedAvatarUrl.includes("amazonaws.com")) {
                    try {
                        signedAvatarUrl = await getSignedUrlFromS3Url(signedAvatarUrl, 1800); // 30 mins access
                        console.log(`[API] Signed avatar URL for Replicate`);
                    } catch (e) {
                        console.warn("[API] Failed to sign avatar URL (might be public or external):", e);
                    }
                }

                if (signedProductUrl && signedProductUrl.includes("amazonaws.com")) {
                    try {
                        signedProductUrl = await getSignedUrlFromS3Url(signedProductUrl, 1800); // 30 mins access
                        console.log(`[API] Signed product URL for Replicate`);
                    } catch (e) {
                        console.warn("[API] Failed to sign product URL (might be public or external):", e);
                    }
                }

                // Generate image with Nano Banana
                // Pass signed URLs so the model can access private S3 objects
                const imageResult = await generateImage({
                    prompt: imagePrompt,
                    avatarDescription: body.avatarDescription,
                    productDescription: body.productDescription,
                    backgroundDescription: body.backgroundDescription,
                    avatarImageUrl: signedAvatarUrl,    // Signed URL
                    productImageUrl: signedProductUrl,  // Signed URL
                    aspectRatio: (body.aspectRatio || "9:16") as "9:16" | "16:9" | "1:1",
                    style: "photorealistic",
                });

                if (!imageResult.success) {
                    throw new Error(imageResult.error || "Image generation failed");
                }

                let referenceImageUrl: string | null = null;

                // If async task, poll for completion
                if (imageResult.taskId && !imageResult.imageUrl) {
                    await db
                        .update(videoJobs)
                        .set({
                            nanoBananaTaskId: imageResult.taskId,
                            updatedAt: new Date(),
                        })
                        .where(eq(videoJobs.id, jobId));

                    const finalStatus = await pollUntilComplete(imageResult.taskId, 120000); // 2 min timeout

                    if (finalStatus.status !== "completed" || !finalStatus.imageUrl) {
                        throw new Error(finalStatus.error || "Image generation timed out");
                    }

                    referenceImageUrl = finalStatus.imageUrl;
                } else {
                    referenceImageUrl = imageResult.imageUrl ?? null;
                }

                // Upload to our S3 for persistence
                if (referenceImageUrl) {
                    try {
                        const imageResponse = await axios.get(referenceImageUrl, {
                            responseType: "arraybuffer",
                        });
                        const imageBuffer = Buffer.from(imageResponse.data);
                        const s3Key = `${getS3Paths(jobId).reference}/reference.png`;

                        // Upload to S3 (without public access)
                        await uploadToS3(s3Key, imageBuffer, "image/png", false);
                        console.log(`[API] Reference image uploaded to S3: ${s3Key}`);

                        // Generate a signed URL for display (valid for 7 days)
                        const signedUrl = await getSignedPlaybackUrl(s3Key, 604800);
                        referenceImageUrl = signedUrl;
                    } catch (uploadError) {
                        console.warn("[API] Failed to upload to S3, using original URL", uploadError);
                    }
                }

                // Update job with the reference image
                await db
                    .update(videoJobs)
                    .set({
                        status: "IMAGE_READY",
                        referenceImageUrl,
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, jobId));

                console.log(`[API] Reference image ready for job: ${jobId}`);

                return NextResponse.json({
                    success: true,
                    jobId: job.id,
                    referenceImageUrl,
                    message: "Reference image generated successfully",
                });
            } catch (imageError) {
                console.error(`[API] Image generation failed for job ${jobId}:`, imageError);

                await db
                    .update(videoJobs)
                    .set({
                        status: "FAILED",
                        errorMessage: imageError instanceof Error ? imageError.message : "Image generation failed",
                        failedAt: "GENERATING_IMAGE",
                        updatedAt: new Date(),
                    })
                    .where(eq(videoJobs.id, jobId));

                return NextResponse.json({
                    success: false,
                    jobId: job.id,
                    error: imageError instanceof Error ? imageError.message : "Image generation failed",
                });
            }
        }

        // Regular job creation (no immediate image generation)
        return NextResponse.json({
            success: true,
            jobId: job.id,
            message: "Video job created successfully",
        });
    } catch (error) {
        console.error("[API] Create job error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create video job",
            },
            { status: 500 }
        );
    }
}
