"use client";

import { motion } from "framer-motion";
import {
    ShoppingBag,
    Smartphone,
    Share2,
    Megaphone,
    TrendingUp
} from "lucide-react";

const USE_CASES = [
    {
        title: "E-Commerce",
        description: "Boost conversion rates on Amazon, Shopify, and Etsy with high-quality product videos.",
        icon: ShoppingBag,
        colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    },
    {
        title: "Social Media",
        description: "Create viral-ready content for TikTok, Instagram Reels, and YouTube Shorts in seconds.",
        icon: Smartphone,
        colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    },
    {
        title: "Digital Ads",
        description: "Run high-CTR video ads on Facebook, Instagram, and TikTok without expensive production costs.",
        icon: Megaphone,
        colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    },
    {
        title: "Marketing",
        description: "Personalized product updates and email marketing campaigns that stand out.",
        icon: Share2,
        colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function UseCasesSection() {
    return (
        <section className="relative w-full py-16 flex flex-col items-center bg-transparent overflow-hidden">

            {/* Header */}
            <div className="max-w-4xl mx-auto text-center px-6 mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-muted-foreground text-sm font-medium mb-8 backdrop-blur-sm">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                        <span>Limitless Possibilities</span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                        One Tool,{" "} 
                               <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-600">
                            Endless Use Cases</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Whether you&apos;re selling on Amazon or building a brand on TikTok, Vidholdify adapts to your needs.
                    </p>
                </motion.div>
            </div>

            {/* Bento Grid */}
            <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {USE_CASES.map((useCase, index) => {
                        const Icon = useCase.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={item}
                                className={`group relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-8 hover:bg-white/[0.06] hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 hover:-translate-y-1 ${useCase.colSpan}`}
                            >
                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Corner Accent */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-brand-primary to-purple-600 opacity-5 blur-3xl group-hover:opacity-15 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Icon Container */}
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-purple-600 mb-6 shadow-lg shadow-brand-primary/20">
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-white transition-colors duration-300">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed flex-1 group-hover:text-white/70 transition-colors duration-300">
                                        {useCase.description}
                                    </p>

                                    {/* Bottom Line Accent */}
                                    <div className="mt-6 h-1 w-12 rounded-full bg-gradient-to-r from-brand-primary to-purple-600 opacity-50 group-hover:w-20 group-hover:opacity-100 transition-all duration-500" />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

        </section>
    );
}
