"use server";

import { db } from "@/lib/db";
import { TopviewVideo, Users, generatedVideos, videoJobs } from "@/configs/schema";
import { desc, eq, sql, and, gte, notInArray } from "drizzle-orm";

export async function getDashboardStats(email: string) {
  try {
    let creditsUsed = 0;
    let creditsAllowed = 0;
    let carryover = 0;
    let carryoverExpiry: Date | null = null;
    let creditsUsedVeo = 0;
    let creditsAllowedVeo = 0;
    let carryoverVeo = 0;

    // 1. Get User Credits by Email
    if (email) {
      const [userRecord] = await db
        .select()
        .from(Users)
        .where(eq(Users.email, email))
        .limit(1);

      if (userRecord) {
        creditsAllowed = userRecord.credits_allowed || 0;
        creditsUsed = userRecord.credits_used || 0;
        carryover = userRecord.carryover || 0;
        carryoverExpiry = userRecord.carryover_expiry || null;

        // Veo/Manual Video Credits
        creditsAllowedVeo = userRecord.credits_allowed_veo || 0;
        creditsUsedVeo = userRecord.credits_used_veo || 0;
        carryoverVeo = userRecord.carryover_veo || 0;
      }
    }

    // 2. Get Video Stats (Total, Processing)
    // Use email for createdBy

    // Total Videos (Legacy/Topview)
    const [totalVideosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(TopviewVideo)
      .where(eq(TopviewVideo.createdBy, email));

    // Total Videos (Manual/Veo3)
    // Querying by userEmail for generatedVideos
    const [manualVideosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(generatedVideos)
      .where(eq(generatedVideos.userEmail, email));

    const totalVideos = Number(totalVideosResult?.count || 0) + Number(manualVideosResult?.count || 0);

    // Processing Videos (Legacy)
    // where createdBy = email AND status IN ('processing', 'pending')
    const [processingCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(TopviewVideo)
      .where(
        sql`${TopviewVideo.createdBy} = ${email} AND ${TopviewVideo.status} IN ('processing', 'pending')`
      );

    // Processing Videos (Manual/Veo3)
    // Query videoJobs table where status is NOT 'DONE' and NOT 'FAILED'
    const [processingManualResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(videoJobs)
      .where(
        and(
          eq(videoJobs.userEmail, email),
          notInArray(videoJobs.status, ["DONE", "FAILED"])
        )
      );

    const processingVideos = Number(processingCountResult?.count || 0) + Number(processingManualResult?.count || 0);

    // 3. Get Recent Videos (last 2 days only - data retention policy)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentVideos = await db
      .select()
      .from(TopviewVideo)
      .where(
        and(
          eq(TopviewVideo.createdBy, email),
          gte(TopviewVideo.createdAt, twoDaysAgo)
        )
      )
      .orderBy(desc(TopviewVideo.createdAt))
      .limit(3);

    return {
      totalVideos,
      processingVideos,
      credits: {
        used: creditsUsed,
        allowed: creditsAllowed,
        carryover: carryover,
        carryoverExpiry: carryoverExpiry,

        // New Veo Stats
        usedVeo: creditsUsedVeo,
        allowedVeo: creditsAllowedVeo,
        carryoverVeo: carryoverVeo,
      },
      recentVideos,
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalVideos: 0,
      processingVideos: 0,
      credits: {
        used: 0,
        allowed: 0,
        carryover: 0,
        carryoverExpiry: null,
        usedVeo: 0,
        allowedVeo: 0,
        carryoverVeo: 0
      },
      recentVideos: [],
    };
  }
}
