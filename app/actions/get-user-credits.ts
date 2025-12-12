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
        carryover: Users.carryover,
        carryoverExpiry: Users.carryover_expiry,
      })
      .from(Users)
      .where(eq(Users.email, email));

    if (!result || result.length === 0) {
      return null;
    }

    const userData = result[0];
    const allowed = userData.creditsAllowed || 0;
    const used = userData.creditsUsed || 0;
    const mainRemaining = Math.max(0, allowed - used);

    // Check if carryover is still valid
    const now = new Date();
    let validCarryover = 0;
    if (userData.carryover && userData.carryover > 0) {
      if (!userData.carryoverExpiry || new Date(userData.carryoverExpiry) > now) {
        validCarryover = userData.carryover;
      }
    }

    const totalAvailable = mainRemaining + validCarryover;

    return {
      allowed,
      used,
      remaining: mainRemaining,
      carryover: validCarryover,
      totalAvailable,
    };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return null;
  }
}

