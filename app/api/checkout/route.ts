import Stripe from "stripe";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/configs/db";
import { Users } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { getAvailableCredits } from "@/utils/creditHelpers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email from Clerk
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    // Check if user has an active subscription with unused credits
    const [existingUser] = await db
      .select({
        subscription_active: Users.subscription_active,
        credits_allowed: Users.credits_allowed,
        credits_used: Users.credits_used,
        carryover: Users.carryover,
        carryover_expiry: Users.carryover_expiry,
      })
      .from(Users)
      .where(eq(Users.email, userEmail))
      .limit(1);

    // If user has an active subscription with unused credits, restrict checkout
    if (existingUser?.subscription_active) {
      const availableCredits = getAvailableCredits({
        credits_allowed: existingUser.credits_allowed,
        credits_used: existingUser.credits_used,
        carryover: existingUser.carryover,
        carryover_expiry: existingUser.carryover_expiry,
        next_credit_reset: null,
        credit_reset_day: null,
      });

      if (availableCredits.available > 10) {
        console.log(`⚠️ User ${userEmail} has ${availableCredits.available} unused credits. Blocking new plan purchase.`);
        return NextResponse.json(
          { 
            error: "You have unused credits remaining. Please use your credits before purchasing a new plan.",
            unusedCredits: availableCredits.available,
            hasCarryover: (existingUser.carryover || 0) > 0,
          },
          { status: 400 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing`,

      // 🔥 CRITICAL: send email INTO subscription metadata
      subscription_data: {
        metadata: { email: userEmail },
      },

      // Optional: helpful for debugging
      metadata: { email: userEmail },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
