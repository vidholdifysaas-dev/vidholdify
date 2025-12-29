"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const [activeComparison, setActiveComparison] = useState<'veo3' | 'standard'>('veo3');

    const comparisons = {
        veo3: {
            before: "/veo_image.jpeg",
            after: "/veo_video.mp4",
            label: "Premium (Veo3)",
            headlineTop: "Product-Holding VEO3",
            headlineBottom: "The Only AI Tool Delivering 60-Second Product Videos",
            subtitle: "Turn any product image into a professional AI UGC video in minutes."
        },
        standard: {
            before: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_5.webp",
            after: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_5.mp4",
            label: "Essential",
            headlineTop: "Product-Holding AI",
            headlineBottom: "Fast, Affordable & Ready to Convert",
            subtitle: "AI-powered product holding videos that deliver results at the most competitive price."
        }
    };

    const activeContent = comparisons[activeComparison];

    return (
        <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background overflow-x-hidden relative">
            {/* GLOBAL LOGO - TOP LEFT */}
            <div className="absolute top-6 left-6 z-50 sm:block hidden">
                <Link href="/" className="transition-opacity hover:opacity-80">
                    <Image
                        src="/Full_logo.svg"
                        alt="Vidholdify Logo"
                        width={150}
                        height={0}
                        className="w-auto h-8 lg:h-10"
                    />
                </Link>
            </div>
            {/* LEFT SIDE - BRANDING & VISUALS */}
            <div className="hidden lg:flex w-1/2 relative flex-col p-4 h-screen overflow-hidden justify-center">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-primary/10 via-purple-600/5 to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[80px] -z-10" />

                {/* Content Container */}
                <div className="relative z-10 flex flex-col h-full items-center text-center justify-center">

                    {/* Main Content */}
                    <div className="flex flex-col justify-center items-center w-full max-w-xl mx-auto">

                        {/* Toggle Switch */}
                        <div className="mb-4 flex justify-center scale-90 origin-center">
                            <div className="bg-white/5 backdrop-blur-md p-1 rounded-full border border-white/10 relative flex z-10 w-fit">
                                <button
                                    onClick={() => setActiveComparison('veo3')}
                                    className="relative z-10 px-8 py-2 text-sm font-medium transition-colors duration-300 rounded-full focus:outline-none"
                                >
                                    <span className={`relative z-10 ${activeComparison === 'veo3' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>Premium (Veo3)</span>
                                    {activeComparison === 'veo3' && (
                                        <motion.div
                                            layoutId="toggleHighlightAuth"
                                            className="absolute inset-0 bg-brand-primary rounded-full shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveComparison('standard')}
                                    className="relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-300 rounded-full focus:outline-none"
                                >
                                    <span className={`relative z-10 ${activeComparison === 'standard' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>Essential</span>
                                    {activeComparison === 'standard' && (
                                        <motion.div
                                            layoutId="toggleHighlightAuth"
                                            className="absolute inset-0 bg-brand-primary rounded-full shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Headline */}
                        <motion.div
                            key={activeComparison}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                                {activeContent.headlineTop} <br className="hidden md:block" />
                                <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-brand-primary to-purple-600 text-white rounded-md shadow-lg shadow-brand-primary/30 transform -rotate-1 mx-2 text-lg">
                                    UGC
                                </span>
                                Videos That Win
                            </h1>
                            <div className="text-base lg:text-lg text-white/80 font-medium mb-3 tracking-normal">
                                {activeContent.headlineBottom}
                            </div>
                        </motion.div>

                        <motion.p
                            key={`sub-${activeComparison}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                            className="text-gray-400 text-sm mb-6 max-w-sm mx-auto"
                        >
                            {activeContent.subtitle}
                        </motion.p>

                        {/* Before/After Grid */}
                        <motion.div
                            key={`grid-${activeComparison}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full max-w-2xl mx-auto flex items-center justify-center gap-4 sm:gap-8"
                        >
                            {/* Left Card: Before */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary/50 to-purple-600/50 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-500"></div>
                                <div className="relative w-36 sm:w-56 aspect-[9/16] rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black/50">
                                    <Image
                                        src={activeContent.before}
                                        fill
                                        className="object-cover"
                                        alt="Before"
                                        sizes="(max-width: 768px) 144px, 224px"
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded-md text-[10px] sm:text-xs font-medium text-white/80 backdrop-blur-sm border border-white/10">Before</div>
                                </div>
                            </div>

                            {/* Creative Arrow */}
                            <div className="flex flex-col items-center justify-center text-white/50 shrink-0">
                                <motion.div
                                    animate={{
                                        x: [0, 5, 0],
                                        opacity: [0.5, 1, 0.5],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="p-3 rounded-full bg-brand-primary/10 border border-brand-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                >
                                    <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 text-brand-primary" />
                                </motion.div>
                            </div>

                            {/* Right Card: After */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-primary to-purple-600 rounded-2xl opacity-50 blur animate-pulse"></div>
                                <div className="relative w-36 sm:w-56 aspect-[9/16] rounded-xl overflow-hidden border-2 border-brand-primary/50 shadow-2xl bg-black/50">
                                    <video
                                        src={activeContent.after}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-primary rounded-md text-[10px] sm:text-xs font-bold text-white shadow-lg shadow-brand-primary/20 backdrop-blur-sm border border-white/10">After</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-3 py-6 sm:p-6 lg:p-12 relative z-10 bg-black/60 backdrop-blur-md lg:border-l border-white/5 min-h-screen">
                {/* Background glow for right side */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] -z-10" />

                <div className="w-full max-w-[calc(100%-8px)] sm:max-w-md mx-auto bg-black/30 backdrop-blur-xl border border-white/10 p-3 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl animate-in fade-in duration-500 box-border">




                    {children}
                </div>
            </div>
        </div>
    );
}

