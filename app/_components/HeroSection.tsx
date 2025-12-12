"use client";

import Link from "next/link";
import { Sparkles, Users, Video, Globe, Mic, Type, Palette } from "lucide-react";
import { motion } from "framer-motion";
import BeforeAfterSlider from "./BeforeAfterSlider";

const stats = [
    { value: "450+", label: "Video Avatars", icon: Users },
    { value: "15+", label: "Languages", icon: Globe },
    { value: "50+", label: "Voices with Accents", icon: Mic },
    { value: "10+", label: "Subtitle Styles", icon: Type },
];

export default function HeroSection() {
    return (
        <div className="relative isolate overflow-hidden">
            {/* ✅ Premium Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.15] -z-20" />


            {/* ✅ Premium Light Streak */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent" />

            <div className="py-20 pt-32 lg:pb-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">

                    {/* Two Column Layout */}
                    <div className="grid md:grid-cols-2 items-center justify-center gap-8 md:gap-4">

                        {/* Left Column - Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="text-center md:text-left order-1 md:order-1"
                        >

                            {/* ✅ Premium Badge */}

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/50 text-muted-foreground text-sm font-medium mb-4 sm:mb-8 backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-brand-primary" />
                                <span>AI-Powered Product Videos</span>
                            </div>
                            {/* ✅ Animated Headline */}
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter font-geist mt-2 mb-6 text-white/95 leading-tight"
                            >
                                Product Avatars for AI{" "}
                                <span
                                    className="relative inline-block px-3 py-1 bg-gradient-to-r from-brand-primary to-purple-600 text-white rounded-lg shadow-lg shadow-brand-primary/40 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                                    style={{
                                        textShadow: '0 2px 10px rgba(65, 59, 250, 0.5)',
                                    }}
                                >
                                    UGC
                                </span>{" "}
                                Videos
                            </motion.h1>

                            {/* ✅ Subtitle Fade-Up */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="mt-6 sm:text-lg text-md leading-8 text-white/60 mb-10"
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
                                className="mt-10 flex items-center justify-center md:justify-start gap-x-6"
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
                            className="relative order-2 md:order-2 flex items-center justify-center md:justify-end px-4 md:px-6 lg:px-10 min-h-[350px] md:min-h-[450px] lg:min-h-[550px]"
                        >
                            <BeforeAfterSlider />
                        </motion.div>

                    </div>

                    {/* ✅ Stats Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-10 sm:mt-36 flex flex-col items-center"
                    >
                        {/* Stats Heading */}

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/50 text-muted-foreground text-sm font-medium mb-12 backdrop-blur-sm">
                            <Sparkles className="w-4 h-4 text-brand-primary" />
                            <span>Key features</span>
                        </div>


                        {/* Stats Cards */}
                        <div className="grid grid-cols-2  lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full">
                            {stats.map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
                                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-purple-600/20 flex items-center justify-center mb-3">
                                            <Icon className="w-5 h-5 text-brand-primary" />
                                        </div>
                                        <span className="text-2xl md:text-3xl font-bold text-white mb-1">
                                            {stat.value}
                                        </span>
                                        <span className="text-xs text-muted-foreground text-center font-medium">
                                            {stat.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

