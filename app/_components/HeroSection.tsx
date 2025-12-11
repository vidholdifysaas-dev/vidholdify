"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import BeforeAfterSlider from "./BeforeAfterSlider";

export default function HeroSection() {
    return (
        <div className="relative isolate overflow-hidden">
            {/* ✅ Premium Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.15] -z-20" />


            {/* ✅ Premium Light Streak */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent" />

            <div className="py-20 sm:py-28 lg:pb-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">

                    {/* Two Column Layout */}
                    <div className="grid lg:grid-cols-2 items-center justify-center">

                        {/* Left Column - Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="text-center lg:text-left order-2 lg:order-1"
                        >

                            {/* ✅ Premium Badge */}

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/50 text-muted-foreground text-sm font-medium mb-8 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-brand-primary" />
                                <span>AI-Powered Product Videos</span>
                            </div>
                            {/* ✅ Animated Headline */}
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-geist mt-2 mb-6"
                                style={{
                                    maskImage: 'linear-gradient(150deg, transparent, black 30%, black 30%, transparent)',
                                    WebkitMaskImage: 'linear-gradient(150deg, transparent, black 30%, black 30%, transparent)'
                                }}
                            >
                                Product Avatars for AI UGC Videos
                            </motion.h1>

                            {/* ✅ Subtitle Fade-Up */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="mt-6 text-lg leading-8 text-white/60 mb-10"
                            >
                                Upload your product image and instantly create an AI avatar showcasing it.
                                <br className="hidden sm:block" />
                                Create scroll-stopping UGC without ever picking up a camera.
                            </motion.p>

                            {/* ✅ Premium CTA Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="mt-10 flex items-center justify-center lg:justify-start gap-x-6"
                            >
                                <Link href="/dashboard">
                                    <button className="shiny-cta focus:outline-none">
                                        <span>Create Now</span>
                                    </button>
                                </Link>
                            </motion.div>

                        </motion.div>

                        {/* Right Column - Before/After Slider */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
                            className="relative order-1 lg:order-2 flex items-center justify-center lg:min-h-[550px]"
                        >
                            <BeforeAfterSlider />
                        </motion.div>

                    </div>

                </div>
            </div>
        </div>
    );
}
