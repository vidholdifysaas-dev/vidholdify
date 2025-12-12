"use client";

import { Check, Sparkles, Loader2, Video, Zap, Rocket, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { pricingData, PricingPlan } from "@/dataUtils/PricingData";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Premium icon component for each plan
function PlanIcon({ iconId, isPopular }: { iconId: PricingPlan["iconId"]; isPopular?: boolean }) {
    const iconConfig = {
        starter: {
            icon: Video,
            gradient: "from-[#397CF7] to-[#165DFC]",
            shadow: "shadow-[#397CF7]/30",
        },
        professional: {
            icon: Zap,
            gradient: "from-[#7C70FF] to-[#413BFA]",
            shadow: "shadow-[#413BFA]/40",
        },
        business: {
            icon: Rocket,
            gradient: "from-[#9333ea] to-[#6366f1]",
            shadow: "shadow-purple-500/30",
        },
        scale: {
            icon: Crown,
            gradient: "from-[#f59e0b] to-[#d97706]",
            shadow: "shadow-amber-500/30",
        },
    };

    const config = iconConfig[iconId];
    const Icon = config.icon;

    return (
        <div className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
            config.gradient,
            config.shadow,
            isPopular && "ring-2 ring-white/20"
        )}>
            <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
    );
}

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [currentPlanTier, setCurrentPlanTier] = useState<string | null>(null);
    const [currentPriceId, setCurrentPriceId] = useState<string | null>(null);
    const [isLoadingPlan, setIsLoadingPlan] = useState(true);

    // Fetch user's current subscription
    useEffect(() => {
        async function fetchUserPlan() {
            try {
                const response = await fetch("/api/user/subscription");
                if (response.ok) {
                    const data = await response.json();
                    setCurrentPlanTier(data.plan_tier || null);
                    setCurrentPriceId(data.stripe_price_id || null);
                }
            } catch (error) {
                console.error("Failed to fetch subscription:", error);
            } finally {
                setIsLoadingPlan(false);
            }
        }
        fetchUserPlan();
    }, []);

    const handleCheckout = async (priceId: string, planId: string) => {
        if (!priceId) {
            toast.error("Price ID not configured. Please contact support.");
            return;
        }

        setLoadingPlanId(planId);

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Failed to create checkout session");
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoadingPlanId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pricing Plans</h1>
                    <p className="text-muted-foreground">
                        Upgrade your plan to unlock more features
                    </p>
                </div>
                {/* Billing Toggle */}
                <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-full border border-border self-start md:self-auto">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                            billingCycle === "monthly"
                                ? "bg-brand-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("yearly")}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 relative",
                            billingCycle === "yearly"
                                ? "bg-brand-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly
                        <span className="absolute -top-3 -right-3 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                            -20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                {pricingData.map((tier, index) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className={cn(
                            "relative flex flex-col p-6 rounded-2xl bg-card border shadow-sm transition-all duration-300 hover:shadow-lg group",
                            tier.isPopular
                                ? "border-brand-primary ring-1 ring-brand-primary/50 shadow-brand-primary/10"
                                : "border-border hover:border-brand-primary/30"
                        )}
                    >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

                        {tier.isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <div className="bg-gradient-to-r from-brand-primary to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 fill-white" />
                                    Popular
                                </div>
                            </div>
                        )}

                        <div className="mb-4 relative z-10">
                            <div className="mb-3">
                                <PlanIcon iconId={tier.iconId} isPopular={tier.isPopular} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">{tier.name}</h3>
                            <p className="text-muted-foreground text-xs min-h-[40px]">{tier.description}</p>
                        </div>

                        <div className="mb-6 flex items-baseline gap-1 relative z-10">
                            <span className="text-3xl font-black text-foreground tracking-tight">${tier.price[billingCycle]}</span>
                            <span className="text-muted-foreground font-medium text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        </div>

                        <ul className="flex-1 flex flex-col gap-2.5 mb-6 relative z-10">
                            {tier.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-xs text-foreground/80">
                                    <div className="p-0.5 rounded-full bg-brand-primary/10 text-brand-primary mt-0.5 shrink-0">
                                        <Check className="w-3 h-3" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        {currentPriceId === tier.priceId[billingCycle] ? (
                            <div className="w-full py-2.5 px-4 rounded-lg font-bold text-sm bg-green-500/20 text-green-500 border border-green-500/30 relative z-10 mt-auto flex items-center justify-center gap-2">
                                <Check className="w-4 h-4" />
                                Current Plan
                            </div>
                        ) : (
                            <button
                                onClick={() => handleCheckout(tier.priceId[billingCycle], tier.id)}
                                disabled={loadingPlanId === tier.id || isLoadingPlan}
                                className={cn(
                                    "w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm relative z-10 mt-auto flex items-center justify-center gap-2",
                                    tier.isPopular
                                        ? "bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-brand-primary/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                        : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80",
                                    (loadingPlanId === tier.id || isLoadingPlan) && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {loadingPlanId === tier.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                {tier.buttonText}
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
