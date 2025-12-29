"use client";

import { Sparkles, UserX, Package, Languages, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
    {
        title: "No Real Models Needed",
        description: "Simply upload a product image, and instantly create an AI avatar holding your product — no need for expensive photoshoots or video shoots.",
        icon: UserX,
    },
    {
        title: "Product-Friendly",
        description: "All avatar templates are expertly designed to naturally hold and showcase products of any size or shape.",
        icon: Package,
    },
    {
        title: "Lip-Synced & Multilingual",
        description: "Our avatars feature multilingual speech and seamless lip-sync, enabling effortless connections with customers worldwide.",
        icon: Languages,
    },
    {
        title: "1000+ Avatars & Customizable",
        description: "Choose from over 400 ready-to-use avatars or create your own custom designs tailored to your brand.",
        icon: Users,
    },
];

const FeatureCard = ({ feature, index }: { feature: typeof FEATURES[0]; index: number }) => {
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative"
        >
            <div className="relative h-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:bg-white/[0.06] hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10">

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Corner Accent */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-brand-primary to-purple-600 opacity-5 blur-3xl group-hover:opacity-15 transition-opacity duration-500" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Icon Container */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-purple-600 mb-6 shadow-lg shadow-brand-primary/20">
                        <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Number Badge */}
                    <span className="absolute top-8 right-8 text-5xl font-black text-white/[0.03] select-none">
                        0{index + 1}
                    </span>

                    {/* Title */}
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 group-hover:text-white transition-colors duration-300">
                        {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                        {feature.description}
                    </p>

                    {/* Bottom Line Accent */}
                    <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-brand-primary to-purple-600 opacity-50 group-hover:w-20 group-hover:opacity-100 transition-all duration-500" />
                </div>
            </div>
        </motion.div>
    );
};

export default function KeyFeaturesSection() {
    return (
        <section className="relative w-full py-24 md:py-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.03]" />

            {/* Gradient Orbs */}
            <div className="absolute top-1/4 -left-32 w-64 h-64 bg-brand-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-600/10 rounded-full blur-[120px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-muted-foreground text-sm font-medium mb-8 backdrop-blur-sm"
                    >
                        <Sparkles className="w-4 h-4 text-brand-primary" />
                        <span>Why Choose Vidholdify?</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
                    >
                        Key Features of{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-600">
                            Product Avatar
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    >
                        Everything you need to create professional product videos without the overhead.
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                    {FEATURES.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
