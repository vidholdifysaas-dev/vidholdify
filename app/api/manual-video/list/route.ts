/**
 * List User's Video Jobs API Route
 * 
 * GET /api/manual-video/list
 * 
 * Returns a list of all video jobs for the authenticated user.
 * Supports pagination and filtering by status.
 * 
 * INPUT (query params):
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 10, max: 50)
 * - status: string (optional) - Filter by status
 * 
 * OUTPUT:
 * {
 *   success: boolean,
 *   jobs: VideoJob[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/configs/db";
import { generatedVideos, VideoJobStatus } from "@/configs/schema";
import { eq, desc, count } from "drizzle-orm";
import { getSignedUrlFromS3Url } from "@/configs/s3";

export const runtime = "nodejs";

const VALID_STATUSES: VideoJobStatus[] = [
    "CREATED",
    "PLANNED",
    "SCENES_GENERATING",
    "SCENES_READY",
    "STITCHING",
    "DONE",
    "FAILED",
];

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user email
        const user = await currentUser();
        const userEmail = user?.emailAddresses[0]?.emailAddress;

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: "User email not found" },
                { status: 400 }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
        const statusFilter = searchParams.get("status") as VideoJobStatus | null;

        // Validate status filter
        if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
            return NextResponse.json(
                { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }

        // Build where clause
        const whereClause = eq(generatedVideos.userEmail, userEmail);

        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(generatedVideos)
            .where(whereClause);

        // Get videos with pagination
        const offset = (page - 1) * limit;
        const videos = await db
            .select()
            .from(generatedVideos)
            .where(whereClause)
            .orderBy(desc(generatedVideos.createdAt))
            .limit(limit)
            .offset(offset);

        // Generate signed URLs for completed videos (valid for 24 hours)
        const videosWithSignedUrls = await Promise.all(
            videos.map(async (video) => {
                let signedVideoUrl: string | undefined;
                let signedImageUrl: string | undefined;

                if (video.videoUrl) {
                    try {
                        signedVideoUrl = await getSignedUrlFromS3Url(video.videoUrl, 604800); // 7 days (max allowed)
                    } catch {
                        signedVideoUrl = video.videoUrl;
                    }
                }

                if (video.thumbnailUrl) {
                    try {
                        signedImageUrl = await getSignedUrlFromS3Url(video.thumbnailUrl, 604800); // 7 days (max allowed)
                    } catch {
                        signedImageUrl = video.thumbnailUrl;
                    }
                }

                // Map to VideoJob-like structure for frontend compatibility
                return {
                    id: video.videoJobId || video.id, // Use link to job if available, else video ID
                    status: "DONE" as VideoJobStatus,
                    productName: video.productName,
                    productDescription: video.productDescription || "",
                    targetLength: 0, // Not stored in generatedVideos
                    platform: "tiktok", // Default
                    referenceImageUrl: signedImageUrl,
                    finalVideoUrl: signedVideoUrl,
                    sceneCount: 0,
                    totalDuration: video.duration || 0,
                    errorMessage: null,
                    createdAt: video.createdAt,
                    updatedAt: video.createdAt,
                    completedAt: video.createdAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            jobs: videosWithSignedUrls,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("[API] List jobs error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to list jobs",
            },
            { status: 500 }
        );
    }
}
