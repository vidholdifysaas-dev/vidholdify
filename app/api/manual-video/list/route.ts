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
import { auth } from "@clerk/nextjs/server";
import { db } from "@/configs/db";
import { videoJobs, VideoJobStatus } from "@/configs/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
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
        const whereClause = statusFilter
            ? and(eq(videoJobs.userId, userId), eq(videoJobs.status, statusFilter))
            : eq(videoJobs.userId, userId);

        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(videoJobs)
            .where(whereClause);

        // Get jobs with pagination
        const offset = (page - 1) * limit;
        const jobs = await db
            .select()
            .from(videoJobs)
            .where(whereClause)
            .orderBy(desc(videoJobs.createdAt))
            .limit(limit)
            .offset(offset);

        // Generate signed URLs for completed videos
        const jobsWithSignedUrls = await Promise.all(
            jobs.map(async (job) => {
                let signedVideoUrl: string | undefined;
                let signedImageUrl: string | undefined;

                if (job.finalVideoUrl) {
                    try {
                        signedVideoUrl = await getSignedUrlFromS3Url(job.finalVideoUrl, 3600);
                    } catch {
                        signedVideoUrl = job.finalVideoUrl;
                    }
                }

                if (job.referenceImageUrl) {
                    try {
                        signedImageUrl = await getSignedUrlFromS3Url(job.referenceImageUrl, 3600);
                    } catch {
                        signedImageUrl = job.referenceImageUrl;
                    }
                }

                return {
                    id: job.id,
                    status: job.status,
                    productName: job.productName,
                    productDescription: job.productDescription,
                    targetLength: parseInt(job.targetLength),
                    platform: job.platform,
                    referenceImageUrl: signedImageUrl,
                    finalVideoUrl: signedVideoUrl,
                    sceneCount: job.sceneCount,
                    totalDuration: job.totalDuration,
                    errorMessage: job.errorMessage,
                    createdAt: job.createdAt,
                    updatedAt: job.updatedAt,
                    completedAt: job.completedAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            jobs: jobsWithSignedUrls,
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
