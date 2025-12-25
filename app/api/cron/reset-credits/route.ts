import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { Users } from '@/configs/schema';
import { eq, lte, and, lt, isNotNull } from 'drizzle-orm';
import { resetMonthlyCredits, shouldResetCredits } from '@/utils/creditHelpers';
import { planLimits } from '@/dataUtils/planLimits';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const now = new Date();
    const results = {
      creditsReset: [] as { email: string; prevReset: Date | null; newReset: Date }[],
      carryoverExpired: [] as { email: string }[],
      subscriptionsExpired: [] as { email: string; previousPlan: string | null }[],
    };

    // =============================================
    // 1. Handle Expired Subscriptions
    // =============================================
    // Find users with active subscriptions where current_period_end has passed
    // This catches subscriptions that Stripe webhooks might have missed
    const expiredSubscriptions = await db
      .select()
      .from(Users)
      .where(
        and(
          eq(Users.subscription_active, true),
          lt(Users.current_period_end, now),
          isNotNull(Users.current_period_end)
        )
      );

    for (const user of expiredSubscriptions) {
      // Downgrade to free plan and clear all subscription fields
      await db
        .update(Users)
        .set({
          subscription_active: false,
          subscription_status: 'expired',
          plan_tier: 'free',

          // Clear TopView credits
          credits_allowed: 0,
          credits_used: 0,
          carryover: 0,
          carryover_expiry: null,

          // Clear VEO3 credits
          credits_allowed_veo: 0,
          credits_used_veo: 0,
          carryover_veo: 0,

          // Clear Stripe subscription fields (keep customer_id for future purchases)
          stripe_subscription_id: null,
          stripe_price_id: null,

          // Clear period dates
          current_period_start: null,
          current_period_end: null,

          // Clear reset tracking
          credit_reset_day: null,
          next_credit_reset: null,

          updated_at: new Date(),
        })
        .where(eq(Users.id, user.id));

      results.subscriptionsExpired.push({
        email: user.email,
        previousPlan: user.plan_tier,
      });

      console.log(`⏰ Cron: Subscription expired for ${user.email}. Downgraded from ${user.plan_tier} to free. All fields cleared.`);
    }

    // =============================================
    // 2. Handle Monthly Credit Reset (for active subscriptions)
    // =============================================
    // This handles both monthly plans AND yearly plans that need monthly credit refresh
    const usersToReset = await db
      .select()
      .from(Users)
      .where(
        and(
          eq(Users.subscription_active, true),
          lte(Users.next_credit_reset, now)
        )
      );

    for (const user of usersToReset) {
      // Double check using the helper (handles timezone normalization if needed)
      if (shouldResetCredits(user, now)) {
        const resetData = resetMonthlyCredits(user);

        // Get plan limits to reset the "allowed" amounts
        const planTier = (user.plan_tier as keyof typeof planLimits) || 'free';
        const limits = planLimits[planTier];

        // Calculate VEO3 carryover (similar to TopView)
        // Carry over unused VEO3 credits from this period
        const veoAllowed = user.credits_allowed_veo || 0;
        const veoUsed = user.credits_used_veo || 0;
        const veoRemaining = Math.max(0, veoAllowed - veoUsed);

        // Check if existing VEO3 carryover is still valid
        const carryExpired = !user.carryover_expiry || now >= user.carryover_expiry;
        const existingVeoCarryover = carryExpired ? 0 : (user.carryover_veo || 0);

        // New VEO3 carryover = unused credits + existing valid carryover
        const newVeoCarryover = veoRemaining + existingVeoCarryover;

        await db
          .update(Users)
          .set({
            // TopView credits reset
            credits_used: resetData.credits_used,
            carryover: resetData.carryover,
            carryover_expiry: resetData.carryover_expiry,
            next_credit_reset: resetData.next_credit_reset,
            // Reset credits_allowed to plan level (important for yearly plans getting monthly credits)
            credits_allowed: limits?.credits ?? user.credits_allowed,

            // VEO3 credits reset with carryover
            credits_used_veo: 0,
            carryover_veo: newVeoCarryover,
            credits_allowed_veo: limits?.credits_veo ?? 0,

            updated_at: new Date(),
          })
          .where(eq(Users.id, user.id));

        results.creditsReset.push({
          email: user.email,
          prevReset: user.next_credit_reset,
          newReset: resetData.next_credit_reset
        });

        console.log(`🔄 Cron: Reset credits for ${user.email}. Next reset: ${resetData.next_credit_reset.toISOString()}. VEO3 carryover: ${newVeoCarryover}`);
      }
    }

    // =============================================
    // 3. Handle Expired Carryover Cleanup
    // =============================================
    const usersWithExpiredCarryover = await db
      .select({ id: Users.id, email: Users.email })
      .from(Users)
      .where(
        and(
          lt(Users.carryover_expiry, now),
          isNotNull(Users.carryover_expiry)
        )
      );

    for (const user of usersWithExpiredCarryover) {
      await db
        .update(Users)
        .set({
          // Clear TopView carryover
          carryover: 0,
          carryover_expiry: null,
          // Clear VEO3 carryover
          carryover_veo: 0,
          updated_at: new Date(),
        })
        .where(eq(Users.id, user.id));

      results.carryoverExpired.push({ email: user.email });
      console.log(`🧹 Cron: Cleared expired carryover for ${user.email}`);
    }

    return NextResponse.json({
      success: true,
      subscriptionsExpiredCount: results.subscriptionsExpired.length,
      creditsResetCount: results.creditsReset.length,
      carryoverExpiredCount: results.carryoverExpired.length,
      details: results
    });

  } catch (error: unknown) {
    console.error('❌ Cron Job Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Cron failed: ${message}`, { status: 500 });
  }
}
