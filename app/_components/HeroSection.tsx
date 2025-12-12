"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { useEffect, useRef } from "react";

const stats = [
    { value: 450, suffix: "+", label: "Video Avatars" },
    { value: 15, suffix: "+", label: "Languages" },
    { value: 50, suffix: "+", label: "Voices with Accents" },
    { value: 10, suffix: "+", label: "Subtitle Styles" },
];

// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView) {
            animate(motionValue, value, {
                duration: 2,
                ease: "easeOut",
            });
        }
    }, [isInView, motionValue, value]);

    useEffect(() => {
        const unsubscribe = rounded.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = latest + suffix;
            }
        });
        return unsubscribe;
    }, [rounded, suffix]);

    return <span ref={ref}>0{suffix}</span>;
}

export default function HeroSection() {
    return (
        <div className="relative isolate overflow-hidden">
            {/* ✅ Premium Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.15] -z-20" />


            {/* ✅ Premium Light Streak */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent" />

            <div className="pt-38">
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
                                className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-geist mt-2 mb-6 text-white/95 leading-tight"
                            >
                                Product-Holding AI {"  "}
                                <span
                                    className="relative inline-block px-3 py-1 bg-gradient-to-r from-brand-primary to-purple-600 text-white rounded-lg shadow-lg shadow-brand-primary/40 transform -rotate-3 hover:rotate-0 transition-transform duration-300"
                                    style={{
                                        textShadow: '0 2px 10px rgba(65, 59, 250, 0.5)',
                                    }}
                                >
                                    UGC
                                </span>{" "}
                                Videos That Win
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

                    {/* ✅ Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-16 sm:mt-24 flex justify-center w-full"
                    >
                        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-6 py-6 sm:px-12 sm:py-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                {stats.map((stat, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <span className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                                            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                        </span>
                                        <span className="text-xs sm:text-sm text-muted-foreground mt-1 text-center">{stat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}

