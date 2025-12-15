"use server";

import { db } from "@/lib/db";
import { TopviewVideo, Users } from "@/configs/schema";
import { desc, eq, sql, and, gte } from "drizzle-orm";

export async function getDashboardStats(email: string) {
  try {
    let creditsUsed = 0;
    let creditsAllowed = 0;
    let carryover = 0;
    let carryoverExpiry: Date | null = null;

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
      }
    }

    // 2. Get Video Stats (Total, Processing)
    // Use email for createdBy
    
    // Total Videos
    const [totalVideosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(TopviewVideo)
      .where(eq(TopviewVideo.createdBy, email));
    
    const totalVideos = Number(totalVideosResult?.count || 0);

    // Processing Videos
    // where createdBy = email AND status IN ('processing', 'pending')
    const [processingCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(TopviewVideo)
        .where(
            sql`${TopviewVideo.createdBy} = ${email} AND ${TopviewVideo.status} IN ('processing', 'pending')`
        );
        
    const processingVideos = Number(processingCountResult?.count || 0);


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
      },
      recentVideos,
    };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalVideos: 0,
      processingVideos: 0,
      credits: { used: 0, allowed: 0, carryover: 0, carryoverExpiry: null },
      recentVideos: [],
    };
  }
}
