"use server";

import { db } from "@/lib/db";
import { Users } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function getUserCredits() {
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return null;
    }

    const result = await db
      .select({
        creditsAllowed: Users.credits_allowed,
        creditsUsed: Users.credits_used,
      })
      .from(Users)
      .where(eq(Users.email, email));

    if (!result || result.length === 0) {
      return null;
    }

    const userData = result[0];
    const allowed = userData.creditsAllowed || 0;
    const used = userData.creditsUsed || 0;
    const remaining = Math.max(0, allowed - used);

    return {
      allowed,
      used,
      remaining,
    };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return null;
  }
}
