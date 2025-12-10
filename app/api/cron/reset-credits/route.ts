import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { Users } from '@/configs/schema';
import { eq, lte, and } from 'drizzle-orm';
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
    
    // Find active users whose next_credit_reset is in the past or today
    // We only care about users with active subscriptions
    const usersToReset = await db
      .select()
      .from(Users)
      .where(
        and(
          eq(Users.subscription_active, true),
          lte(Users.next_credit_reset, now)
        )
      );

    if (usersToReset.length === 0) {
      return NextResponse.json({ message: 'No credits to reset', count: 0 });
    }

    const results = [];

    for (const user of usersToReset) {
      // Double check using the helper (handles timezone normalization if needed)
      if (shouldResetCredits(user, now)) {
        const resetData = resetMonthlyCredits(user);
        
        // Get plan limits to reset the "allowed" amounts if needed
        // (Though usually allowed amounts don't change, it's good practice to enforce plan limits on reset)
        const planTier = (user.plan_tier as keyof typeof planLimits) || 'free';
        const limits = planLimits[planTier];

        await db
          .update(Users)
          .set({
            credits_used: resetData.credits_used,
            carryover: resetData.carryover,
            carryover_expiry: resetData.carryover_expiry,
            next_credit_reset: resetData.next_credit_reset,
            // Ensure allowed is correct
            credits_allowed: limits?.credits ?? user.credits_allowed,
            updated_at: new Date(),
          })
          .where(eq(Users.id, user.id));

        results.push({
          email: user.email,
          prevReset: user.next_credit_reset,
          newReset: resetData.next_credit_reset
        });
        
        console.log(`🔄 Cron: Reset credits for ${user.email}. Next reset: ${resetData.next_credit_reset.toISOString()}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length,
      details: results 
    });

  } catch (error: unknown) {
    console.error('❌ Cron Job Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Cron failed: ${message}`, { status: 500 });
  }
}
