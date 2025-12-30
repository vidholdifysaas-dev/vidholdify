import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSignedUrlFromS3Url } from "@/configs/s3";
import { db } from "@/configs/db";
import { videoJobs, VideoLength, VideoPlatform, Users } from "@/configs/schema";
import {
    buildImagePrompt,
    generateImage,
    pollUntilComplete,
    isConfigured as isNanoBananaConfigured,
} from "@/configs/ai-services/nano-banana";
import { getAvailableVeoCredits, deductVeoCredits } from "@/utils/creditHelpers";
import { uploadToS3, getS3Paths, getSignedPlaybackUrl } from "@/configs/s3";
import { randomUUID } from "crypto";
import axios from "axios";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes to allow for image generation

// Validation types
interface CreateJobRequest {
    productName: string;
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

        // Get user email from Clerk
        let userEmail: string | null = null;
        try {
            const { clerkClient } = await import("@clerk/nextjs/server");
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            userEmail = user.emailAddresses?.[0]?.emailAddress || null;
        } catch (e) {
            console.error("[API] Failed to get user email:", e);
        }

        const body: CreateJobRequest = await request.json();

        // Validate required fields
        if (!body.productName || body.productName.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: "Product name is required (min 2 characters)" },
                { status: 400 }
            );
        }



        if (!["15", "30", "45", "60"].includes(body.targetLength)) {
            return NextResponse.json(
                { success: false, error: "Target length must be 15, 30, 45, or 60 seconds" },
                { status: 400 }
            );
        }

        // Generate job ID
        const jobId = randomUUID();

        // Build image prompt if not provided
        // Include flags for uploaded images so prompt is tailored appropriately
        const imagePrompt = body.imagePrompt || buildImagePrompt({
            productName: body.productName,
            // productDescription: body.productDescription, // Removed
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
                userEmail, // Store user's email
                status: "CREATED",
                productName: body.productName.trim(),
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

            // Credit Check
            if (!userEmail) {
                return NextResponse.json({ success: false, error: "User email not found" }, { status: 401 });
            }

            const userResult = await db
                .select({
                    credits_allowed_veo: Users.credits_allowed_veo,
                    credits_used_veo: Users.credits_used_veo,
                    carryover_veo: Users.carryover_veo,
                    carryover_expiry: Users.carryover_expiry,
                })
                .from(Users)
                .where(eq(Users.email, userEmail));

            if (!userResult || userResult.length === 0) {
                return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
            }

            const userCredits = userResult[0];
            const available = getAvailableVeoCredits(userCredits);

            if (available.available < 1) {
                return NextResponse.json(
                    { success: false, error: `Insufficient credits. Available: ${available.available}, Required: 1` },
                    { status: 402 } // Payment Required
                );
            }

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
                    // productDescription removed
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
                        // Nano Banana returns JPG
                        const s3Key = `${getS3Paths(jobId).reference}/reference.jpg`;

                        // Upload to S3 (without public access)
                        await uploadToS3(s3Key, imageBuffer, "image/jpeg", false);
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

                // Deduct 1 Credit for successful image generation
                try {
                    const deduction = deductVeoCredits(userCredits, 1);
                    await db
                        .update(Users)
                        .set({
                            credits_used_veo: deduction.credits_used_veo,
                            carryover_veo: deduction.carryover_veo,
                        })
                        .where(eq(Users.email, userEmail));
                    console.log(`[API] Deducted 1 VEO credit for image generation. Remaining used: ${deduction.credits_used_veo}`);
                } catch (creditError) {
                    console.error("[API] Failed to deduct credits after success:", creditError);
                    // We don't fail the request, but we log the error. In production, this might need manual reconciliation.
                }

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
