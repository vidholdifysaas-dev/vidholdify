// app/api/webhook/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/configs/db";
import { Users } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { planLimits } from "@/dataUtils/planLimits";
import {
    initializeCreditReset,
    calculateCarryover,
    resetMonthlyCredits,
    shouldResetCredits
} from "@/utils/creditHelpers";

// Extended Stripe types to include properties that exist at runtime
// but may not be in the current type definitions
interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
    current_period_start: number;
    current_period_end: number;
}

interface StripeInvoiceWithSubscription extends Stripe.Invoice {
    subscription: string | Stripe.Subscription;
}


export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20" as any,
});

// map priceId -> plan tier (use your real price IDs)
function getPlanTier(priceId: string) {
    if (
        priceId === "price_1SdMjxLwv1puVvqSszOeB9X3" ||
        priceId === "price_1SdMo4Lwv1puVvqSF5BtLjwd"
    ) return "starter";

    if (
        priceId === "price_1SdMkyLwv1puVvqStunGMdK6" ||
        priceId === "price_1SdMxeLwv1puVvqS7nHfuP09"
    ) return "professional";

    if (
        priceId === "price_1SdMmCLwv1puVvqSh9yX8vnP" ||
        priceId === "price_1SdMySLwv1puVvqSokK7EAUM"
    ) return "business";

    if (
        priceId === "price_1SdMmyLwv1puVvqSUc1gPxh1" ||
        priceId === "price_1SdMzOLwv1puVvqSYLsQBbQs"
    ) return "scale";

    return "free";
}

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = (await headers()).get("stripe-signature");

        if (!signature) {
            return new Response("Missing Stripe signature", { status: 400 });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("❌ Invalid signature:", message);
            return new Response(`Webhook Error: ${message}`, { status: 400 });
        }

        console.log("🔔 Stripe Event:", event.type);

        // 1) checkout.session.completed -> new subscription created OR plan change
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            // 🔍 DEBUG: Log the entire session to see what we're receiving
            console.log("📦 Full Session Object:", JSON.stringify(session, null, 2));
            console.log("📦 Session Metadata:", session.metadata);
            console.log("📦 Session Customer:", session.customer);
            console.log("📦 Session Subscription:", session.subscription);

            const userEmail = session.metadata?.email; // Get email from metadata
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            console.log("🔍 Extracted userEmail:", userEmail);
            console.log("🔍 Extracted customerId:", customerId);
            console.log("🔍 Extracted subscriptionId:", subscriptionId);

            if (!userEmail || !subscriptionId) {
                console.error("❌ Missing userEmail or subscriptionId");
                console.error("❌ userEmail:", userEmail);
                console.error("❌ subscriptionId:", subscriptionId);
                return NextResponse.json({ received: true });
            }

            // Fetch current user data to check if this is a plan change or new subscription
            const [currentUser] = await db
                .select({
                    id: Users.id,
                    plan_tier: Users.plan_tier,
                    stripe_subscription_id: Users.stripe_subscription_id,
                    credits_allowed: Users.credits_allowed,
                    credits_used: Users.credits_used,
                    next_credit_reset: Users.next_credit_reset,
                    credit_reset_day: Users.credit_reset_day,
                    carryover: Users.carryover,
                    carryover_expiry: Users.carryover_expiry,
                    current_period_start: Users.current_period_start,
                })
                .from(Users)
                .where(eq(Users.email, userEmail));

            // get full subscription
            const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
            ) as any;

            const priceId = subscription.items.data[0].price.id;
            const planTier = getPlanTier(priceId);
            const limits = planLimits[planTier] ?? { credits: 0 };

            const periodStart = subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : null;
            const periodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null;

            // Check if this is a plan change (upgrade/downgrade) or new subscription
            const isPlanChange = currentUser && currentUser.stripe_subscription_id && currentUser.plan_tier !== planTier;

            let carryoverData: { carryover: number; carryover_expiry: Date | null } = { carryover: 0, carryover_expiry: null };
            let resetInfo: { credit_reset_day: number; next_credit_reset: Date } = { credit_reset_day: 0, next_credit_reset: new Date() };

            if (isPlanChange && currentUser.next_credit_reset) {
                // Plan change: Calculate carryover to preserve unused credits
                console.log(`🔄 Plan change detected: ${currentUser.plan_tier} → ${planTier}`);

                const { carryoverAmount, carryoverExpiry } = calculateCarryover(
                    currentUser.credits_allowed || 0,
                    currentUser.credits_used || 0,
                    currentUser.next_credit_reset,
                    currentUser.carryover || 0,
                    currentUser.carryover_expiry
                );

                carryoverData = {
                    carryover: carryoverAmount,
                    carryover_expiry: carryoverExpiry,
                };

                console.log(`📦 Plan Change Carryover: ${carryoverAmount} credits, Expires=${carryoverExpiry?.toISOString()}`);

                // Preserve existing reset day for plan changes, but ensure next_credit_reset is in the future
                const now = new Date();
                let nextReset = currentUser.next_credit_reset;

                // If next_credit_reset is in the past, calculate the next valid reset date
                if (nextReset && nextReset < now) {
                    const resetDay = currentUser.credit_reset_day ?? now.getDate();
                    const nextResetDate = new Date(now.getFullYear(), now.getMonth(), resetDay, 0, 0, 0);

                    // If the reset day this month has passed, move to next month
                    if (nextResetDate <= now) {
                        nextResetDate.setMonth(nextResetDate.getMonth() + 1);
                    }
                    nextReset = nextResetDate;
                    console.log(`🔄 Reset date was in past, updated to: ${nextReset.toISOString()}`);
                }

                resetInfo = {
                    credit_reset_day: currentUser.credit_reset_day ?? now.getDate(),
                    next_credit_reset: nextReset,
                };
            } else {
                // New subscription: Initialize credit reset tracking
                resetInfo = periodStart ? initializeCreditReset(periodStart) : {
                    credit_reset_day: new Date().getDate(),
                    next_credit_reset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                };

                // New subscription: Clear any existing carryover
                carryoverData = {
                    carryover: 0,
                    carryover_expiry: null,
                };

                console.log("✨ New subscription created");
            }

            const updateData = {
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_price_id: priceId,
                subscription_status: subscription.status ?? "active",
                subscription_active: subscription.status === "active",
                plan_tier: planTier,

                // Update NEW plan's MONTHLY credit allowance (TopView)
                credits_allowed: limits.credits,

                // Update NEW plan's VEO3 credit allowance
                credits_allowed_veo: limits.credits_veo,

                // For new subscriptions, reset used credits to 0
                // For plan changes, preserve current usage
                ...(isPlanChange ? {} : {
                    credits_used: 0,
                    credits_used_veo: 0,
                    carryover_veo: 0,
                }),

                // credit reset tracking
                credit_reset_day: resetInfo.credit_reset_day,
                next_credit_reset: resetInfo.next_credit_reset,

                // carryover data (stacked for plan changes, cleared for new subscriptions)
                carryover: carryoverData.carryover ?? 0,
                carryover_expiry: carryoverData.carryover_expiry ?? null,

                current_period_start: periodStart,
                current_period_end: periodEnd,
                updated_at: new Date(),
            };

            console.log("📝 PRE-DB UPDATE DATA:", JSON.stringify({
                ...updateData,
                carryover_expiry: updateData.carryover_expiry,
                current_period_start: updateData.current_period_start,
                current_period_end: updateData.current_period_end
            }, null, 2));

            await db
                .update(Users)
                .set(updateData)
                .where(eq(Users.email, userEmail));

            if (isPlanChange) {
                console.log(`✅ Plan changed: ${userEmail} → ${planTier} (reset cycle preserved, day=${currentUser.credit_reset_day})`);
            } else {
                console.log("✅ Subscription created for user with email:", userEmail);
            }
        }

        if (event.type === "customer.subscription.created") {
            const subscription = event.data.object as any;
            const subscriptionId = subscription.id;
            const customerId = subscription.customer as string;
            const priceId = subscription.items.data[0]?.price?.id;

            const planTier = getPlanTier(priceId);
            const limits = planLimits[planTier] ?? { credits: 0 };

            // period - access directly from subscription object
            const periodStart = subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000)
                : null;
            const periodEnd = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null;

            // find user via customerDetails
            const customer = await stripe.customers.retrieve(customerId);
            const email =
                ('email' in customer ? customer.email : null) ??
                ('metadata' in customer ? customer.metadata?.email : null) ??
                null;

            if (!email) {
                console.warn("customer.subscription.created: No email found.");
            } else {
                // initialize reset schedule
                const resetInfo = periodStart
                    ? initializeCreditReset(periodStart)
                    : {
                        credit_reset_day: new Date().getDate(),
                        next_credit_reset: new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000
                        ),
                    };

                await db
                    .update(Users)
                    .set({
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        stripe_price_id: priceId,
                        subscription_status: subscription.status,
                        subscription_active: subscription.status === "active",
                        plan_tier: planTier,

                        // TopView credits
                        credits_allowed: limits.credits,
                        credits_used: 0,

                        // VEO3 credits
                        credits_allowed_veo: limits.credits_veo,
                        credits_used_veo: 0,
                        carryover_veo: 0,

                        credit_reset_day: resetInfo.credit_reset_day,
                        next_credit_reset: resetInfo.next_credit_reset,

                        carryover: 0,
                        carryover_expiry: null,

                        current_period_start: periodStart,
                        current_period_end: periodEnd,
                        updated_at: new Date(),
                    })
                    .where(eq(Users.email, email));

                console.log("✅ customer.subscription.created processed for:", email);
            }
        }


        // 3) invoice.payment_succeeded -> renewal (reset used credits)
        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object as StripeInvoiceWithSubscription;
            const subscriptionId = (typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription?.id) as string | undefined;

            if (subscriptionId) {
                // Fetch current user data to check if reset is needed
                const [currentUser] = await db
                    .select({
                        id: Users.id,
                        credits_allowed: Users.credits_allowed,
                        credits_used: Users.credits_used,
                        next_credit_reset: Users.next_credit_reset,
                        credit_reset_day: Users.credit_reset_day,
                        carryover: Users.carryover,
                        carryover_expiry: Users.carryover_expiry,
                        current_period_start: Users.current_period_start,
                    })
                    .from(Users)
                    .where(eq(Users.stripe_subscription_id, subscriptionId));

                const subscription = await stripe.subscriptions.retrieve(
                    subscriptionId
                ) as any;

                const priceId = subscription.items.data[0].price.id;
                const planTier = getPlanTier(priceId);
                const limits = planLimits[planTier] ?? { credits: 0 };

                const periodStart = subscription.current_period_start
                    ? new Date(subscription.current_period_start * 1000)
                    : null;
                const periodEnd = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : null;

                // Check if we need to reset credits
                const now = new Date();
                let resetData: { credits_used?: number; carryover?: number; next_credit_reset?: Date } = {};

                if (currentUser && shouldResetCredits(currentUser, now)) {
                    const reset = resetMonthlyCredits(currentUser);
                    resetData = {
                        credits_used: reset.credits_used,
                        carryover: reset.carryover,
                        next_credit_reset: reset.next_credit_reset,
                    };
                    console.log("🔄 Monthly credits reset for subscription:", subscriptionId);
                }

                await db
                    .update(Users)
                    .set({
                        subscription_status: "active",
                        subscription_active: true,

                        // apply reset data if needed
                        ...resetData,

                        // ensure allowed credits reflect current plan (TopView + VEO3)
                        credits_allowed: limits.credits,
                        credits_allowed_veo: limits.credits_veo,

                        current_period_start: periodStart,
                        current_period_end: periodEnd,
                        updated_at: new Date(),
                    })
                    .where(eq(Users.stripe_subscription_id, subscriptionId));

                console.log("🎉 Subscription renewed:", subscriptionId);
            }
        }

        // 4) subscription deleted -> canceled
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as Stripe.Subscription;

            await db
                .update(Users)
                .set({
                    subscription_active: false,
                    subscription_status: "canceled",
                    plan_tier: "none",

                    // zero out allowed credits (TopView + VEO3)
                    credits_allowed: 0,
                    credits_allowed_veo: 0,

                    // clear carryover
                    carryover: 0,
                    carryover_veo: 0,
                    carryover_expiry: null,

                    updated_at: new Date(),
                })
                .where(eq(Users.stripe_subscription_id, subscription.id));

            console.log("❌ Subscription canceled:", subscription.id);
        }

        // 5) invoice.payment_failed -> mark past_due
        if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as StripeInvoiceWithSubscription;
            const subscriptionId = (typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription?.id) as string | undefined;

            if (subscriptionId) {
                await db
                    .update(Users)
                    .set({
                        subscription_status: "past_due",
                        subscription_active: false,
                        updated_at: new Date(),
                    })
                    .where(eq(Users.stripe_subscription_id, subscriptionId));

                console.log("⚠️ Payment failed:", subscriptionId);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("❌ Webhook Handler Error:", err);
        return new Response("Webhook handler failed", { status: 500 });
    }
}
