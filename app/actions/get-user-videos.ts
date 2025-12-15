"use server";

import { db } from "@/lib/db";
import { TopviewVideo } from "@/configs/schema";
import { desc, eq, and, gte, sql } from "drizzle-orm";

export async function getUserVideos(email: string) {
  try {
    // Get date from 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const videos = await db
      .select()
      .from(TopviewVideo)
      .where(
        and(
          eq(TopviewVideo.createdBy, email),
          gte(TopviewVideo.createdAt, twoDaysAgo)
        )
      )
      .orderBy(desc(TopviewVideo.createdAt));
    return videos;
  } catch (error) {
    console.error("Error fetching user videos:", error);
    return [];
  }
}
