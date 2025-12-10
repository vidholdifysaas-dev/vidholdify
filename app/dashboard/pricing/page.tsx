"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { pricingData } from "@/dataUtils/PricingData";
import { useState } from "react";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
                            <div className="text-4xl mb-3">{tier.icon}</div>
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

                        <Link href={`/dashboard/billing?planId=${tier.priceId[billingCycle]}`} className="w-full relative z-10 mt-auto">
                            <button
                                className={cn(
                                    "w-full py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm",
                                    tier.isPopular
                                        ? "bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-brand-primary/25 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                        : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
                                )}
                            >
                                {tier.buttonText}
                            </button>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
