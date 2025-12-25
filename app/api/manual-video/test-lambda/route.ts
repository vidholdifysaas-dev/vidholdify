/**
 * Test Lambda Merge API Route
 * 
 * POST /api/manual-video/test-lambda
 * 
 * Allows testing the Lambda merger with custom S3 URLs
 * Useful for debugging and verifying the silence detection & trim works correctly
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    invokeMergerLambda,
    isLambdaMergerConfigured,
} from "@/configs/ai-services/lambda-merger";
import { getSignedPlaybackUrl } from "@/configs/s3";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

interface TestClip {
    s3Url: string;      // Full S3 URL or just the key
    sceneIndex: number;
    duration?: number;
}

interface TestLambdaRequest {
    clips: TestClip[];
    jobId?: string;
    crossfadeDuration?: number;
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

        // Check if Lambda is configured
        if (!isLambdaMergerConfigured()) {
            return NextResponse.json(
                { success: false, error: "Lambda merger is not configured. Check LAMBDA_MERGER_FUNCTION_NAME env var." },
                { status: 500 }
            );
        }

        const body: TestLambdaRequest = await request.json();
        const { clips, jobId, crossfadeDuration = 0 } = body;

        if (!clips || clips.length === 0) {
            return NextResponse.json(
                { success: false, error: "No clips provided" },
                { status: 400 }
            );
        }

        // Validate clips
        for (let i = 0; i < clips.length; i++) {
            if (!clips[i].s3Url) {
                return NextResponse.json(
                    { success: false, error: `Clip ${i} is missing s3Url` },
                    { status: 400 }
                );
            }
        }

        console.log(`[TestLambda] Testing merge with ${clips.length} clips`);

        // Convert S3 URLs to S3 keys
        const bucket = process.env.AWS_S3_BUCKET_NAME;
        if (!bucket) {
            return NextResponse.json(
                { success: false, error: "AWS_S3_BUCKET_NAME not configured" },
                { status: 500 }
            );
        }

        // Extract S3 keys from URLs
        const processedClips = clips.map((clip, index) => {
            let s3Key = clip.s3Url;

            // If it's a full URL, extract just the key
            // Example: https://bucket.s3.region.amazonaws.com/video-jobs/123/scenes/scene_0_raw.mp4
            // Extract: video-jobs/123/scenes/scene_0_raw.mp4
            if (clip.s3Url.includes('amazonaws.com/')) {
                const urlParts = clip.s3Url.split('amazonaws.com/');
                s3Key = urlParts[1] || clip.s3Url;
            } else if (clip.s3Url.startsWith('s3://')) {
                // Handle s3://bucket/key format
                const s3Parts = clip.s3Url.replace('s3://', '').split('/');
                s3Key = s3Parts.slice(1).join('/');
            }

            return {
                s3Key,
                sceneIndex: clip.sceneIndex !== undefined ? clip.sceneIndex : index,
                duration: clip.duration || 8,
            };
        });

        // Generate test job ID if not provided
        const testJobId = jobId || `test-${Date.now()}`;
        const outputKey = `video-jobs/${testJobId}/final/test_merged.mp4`;

        console.log(`[TestLambda] Job ID: ${testJobId}`);
        console.log(`[TestLambda] Clips:`, processedClips);
        console.log(`[TestLambda] Output Key: ${outputKey}`);

        // Invoke Lambda
        const result = await invokeMergerLambda({
            jobId: testJobId,
            clips: processedClips,
            outputKey,
            crossfadeDuration,
        });

        if (result.success && result.finalVideoKey) {
            console.log(`[TestLambda] SUCCESS! Final video key: ${result.finalVideoKey}`);

            // Generate a signed URL for playback (1 hour expiration)
            const signedUrl = await getSignedPlaybackUrl(result.finalVideoKey, 3600);

            console.log(`[TestLambda] Signed URL generated`);

            return NextResponse.json({
                success: true,
                message: "Lambda merge completed successfully!",
                finalVideoUrl: signedUrl, // Return signed URL instead of direct S3 URL
                finalVideoKey: result.finalVideoKey,
                totalDuration: result.totalDuration,
                testJobId,
            });
        } else {
            console.error(`[TestLambda] FAILED: ${result.error}`);
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[TestLambda] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check Lambda status
export async function GET() {
    const isConfigured = isLambdaMergerConfigured();
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const functionName = process.env.LAMBDA_MERGER_FUNCTION_NAME;

    return NextResponse.json({
        success: true,
        lambdaConfigured: isConfigured,
        functionName: functionName || "video-merger",
        bucket: bucket ? `${bucket.substring(0, 10)}...` : "Not set",
    });
}
