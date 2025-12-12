import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Users } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email from Clerk
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    // Fetch user subscription from database
    const [dbUser] = await db
      .select({
        plan_tier: Users.plan_tier,
        subscription_status: Users.subscription_status,
        subscription_active: Users.subscription_active,
        credits_allowed: Users.credits_allowed,
        credits_used: Users.credits_used,
        current_period_end: Users.current_period_end,
        stripe_price_id: Users.stripe_price_id,
      })
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ 
        plan_tier: null,
        subscription_active: false 
      });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error("❌ Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
