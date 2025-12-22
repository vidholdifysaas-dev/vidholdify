"use server";

import { db } from "@/lib/db";
import { TopviewVideo, videoJobs } from "@/configs/schema";
import { eq, and, gte } from "drizzle-orm";
import { getSignedUrlFromS3Url } from "@/configs/s3";

export async function getUserVideos(email: string) {
  try {
    // Get date from 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Fetch from Old Table (TopviewVideo)
    const oldVideosPromise = db
      .select()
      .from(TopviewVideo)
      .where(
        and(
          eq(TopviewVideo.createdBy, email),
          gte(TopviewVideo.createdAt, twoDaysAgo)
        )
      );

    // Fetch from Video Jobs directly (Source of Truth)
    // Only get DONE jobs
    const newVideosPromise = db
      .select()
      .from(videoJobs)
      .where(
        and(
          eq(videoJobs.userEmail, email),
          eq(videoJobs.status, "DONE"),
          gte(videoJobs.createdAt, twoDaysAgo)
        )
      )
      .orderBy(videoJobs.createdAt);

    const [oldVideos, newVideos] = await Promise.all([oldVideosPromise, newVideosPromise]);

    // Normalize Old Videos
    const normalizedOld = oldVideos.map(v => ({
      id: v.id,
      productName: v.productName,
      videoUrl: v.videoUrl,
      videoCoverUrl: v.videoCoverUrl,
      createdAt: v.createdAt,
      duration: v.duration,
      status: v.status || "completed",
      type: "legacy" as const,
    }));

    // Normalize New Videos & Sign URLs
    // We need to sign S3 URLs because they might be private
    const normalizedNew = await Promise.all(
      newVideos.map(async (v) => {
        let signedVideoUrl = v.finalVideoUrl;
        let signedCoverUrl = v.referenceImageUrl;

        if (v.finalVideoUrl) {
          try {
            // 7 days expiry
            signedVideoUrl = await getSignedUrlFromS3Url(v.finalVideoUrl, 604800);
          } catch (e) {
            console.warn(`Failed to sign video URL for ${v.id}`, e);
          }
        }

        if (v.referenceImageUrl) {
          try {
            signedCoverUrl = await getSignedUrlFromS3Url(v.referenceImageUrl, 604800);
          } catch (e) {
            console.warn(`Failed to sign cover URL for ${v.id}`, e);
          }
        }

        return {
          id: v.id,
          productName: v.productName,
          videoUrl: signedVideoUrl,
          videoCoverUrl: signedCoverUrl,
          createdAt: v.createdAt,
          duration: v.totalDuration ? `${v.totalDuration}s` : undefined,
          status: "completed",
          type: "manual" as const,
        };
      })
    );

    const allVideos = [...normalizedNew, ...normalizedOld].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return allVideos;
  } catch (error) {
    console.error("Error fetching user videos:", error);
    return [];
  }
}
