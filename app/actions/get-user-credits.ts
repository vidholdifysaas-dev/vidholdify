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
        // Plan tier
        planTier: Users.plan_tier,
        // TopView (UGC) credits
        creditsAllowed: Users.credits_allowed,
        creditsUsed: Users.credits_used,
        carryover: Users.carryover,
        carryoverExpiry: Users.carryover_expiry,
        // VEO3 (Manual Video) credits
        creditsAllowedVeo: Users.credits_allowed_veo,
        creditsUsedVeo: Users.credits_used_veo,
        carryoverVeo: Users.carryover_veo,
      })
      .from(Users)
      .where(eq(Users.email, email));

    if (!result || result.length === 0) {
      return null;
    }

    const userData = result[0];

    // TopView credits calculation
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

    // VEO3 credits calculation
    const allowedVeo = userData.creditsAllowedVeo || 0;
    const usedVeo = userData.creditsUsedVeo || 0;
    const mainRemainingVeo = Math.max(0, allowedVeo - usedVeo);

    // VEO3 carryover (uses same expiry as TopView)
    let validCarryoverVeo = 0;
    if (userData.carryoverVeo && userData.carryoverVeo > 0) {
      if (!userData.carryoverExpiry || new Date(userData.carryoverExpiry) > now) {
        validCarryoverVeo = userData.carryoverVeo;
      }
    }

    const totalAvailableVeo = mainRemainingVeo + validCarryoverVeo;

    return {
      // Plan tier
      planTier: userData.planTier || "free",

      // TopView (UGC) credits
      allowed,
      used,
      remaining: mainRemaining,
      carryover: validCarryover,
      totalAvailable,

      // VEO3 (Manual Video) credits
      allowedVeo,
      usedVeo,
      remainingVeo: mainRemainingVeo,
      carryoverVeo: validCarryoverVeo,
      totalAvailableVeo,
    };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return null;
  }
}
