"use client";

import { Check, Sparkles, Video, Zap, Rocket, Crown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { pricingData, PricingPlan } from "@/dataUtils/PricingData";
import { useState } from "react";

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
            "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
            config.gradient,
            config.shadow,
            isPopular && "ring-2 ring-white/20"
        )}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
    );
}

export default function PricingSection() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    return (
        <section id="pricing" className="w-full py-12 sm:py-24 px-6 flex flex-col items-center relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] -z-10" />

            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-12 relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
                    Simple, transparent pricing
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                    Choose the perfect plan for your video creation needs.
                </p>

                {/* Billing Toggle */}
                <div className="inline-flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-white/5 backdrop-blur-sm self-center">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            billingCycle === "monthly"
                                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("yearly")}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 relative",
                            billingCycle === "yearly"
                                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly
                        <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                            -20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {pricingData.map((tier, index) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn(
                            "relative flex flex-col p-6 rounded-3xl bg-card/50 backdrop-blur-md border shadow-2xl transition-all duration-300 hover:-translate-y-2 group",
                            tier.isPopular
                                ? "border-brand-primary ring-1 ring-brand-primary/50 shadow-brand-primary/20 lg:-mt-6 lg:mb-6 z-10"
                                : "border-white/10 hover:border-white/20 hover:shadow-brand-primary/5"
                        )}
                    >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />

                        {tier.isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <div className="bg-gradient-to-r from-brand-primary to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3 fill-white" />
                                    Most Popular
                                </div>
                            </div>
                        )}

                        <div className="mb-6 relative z-10 text-center flex flex-col items-center">
                            <div className="mb-4">
                                <PlanIcon iconId={tier.iconId} isPopular={tier.isPopular} />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                            <p className="text-muted-foreground text-sm h-12 flex items-center justify-center">{tier.description}</p>
                        </div>

                        <div className="mb-8 flex items-baseline justify-center gap-1 relative z-10">
                            <span className="text-4xl font-black text-foreground tracking-tight">${tier.price[billingCycle]}</span>
                            <span className="text-muted-foreground font-medium">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                        </div>

                        <ul className="flex-1 flex flex-col gap-3 mb-8 relative z-10">
                            {tier.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                    <div className="p-0.5 rounded-full bg-brand-primary/10 text-brand-primary mt-0.5 shrink-0">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link href={`/sign-up?plan=${tier.id}&cycle=${billingCycle}`} className="w-full relative z-10 mt-auto">
                            <button
                                className={cn(
                                    "w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                                    tier.isPopular
                                        ? "bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-brand-primary/25"
                                        : "bg-foreground text-background hover:bg-foreground/90"
                                )}
                            >
                                {tier.buttonText}
                            </button>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
