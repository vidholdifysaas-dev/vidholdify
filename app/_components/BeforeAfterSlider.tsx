"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function BeforeAfterSlider() {
    const [sliderPosition, setSliderPosition] = useState(50);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderPosition(Number(e.target.value));
    };

    return (
        <div className="relative w-full max-w-[320px] min-h-[300px] flex items-center justify-end">
            {/* Main Slider Container with Premium Border */}
            <div
                className="relative w-full sm:aspect-[2/3] aspect-[9/12] justify-end rounded-xl overflow-hidden bg-background/50 backdrop-blur-sm border-2 border-brand-primary/30"
                style={{
                    boxShadow: `
                        0 0 0 1px hsl(var(--brand-primary) / 0.1),
                        0 0 20px hsl(var(--brand-primary) / 0.3),
                        0 0 40px hsl(var(--brand-primary) / 0.2),
                        0 20px 60px rgba(0, 0, 0, 0.4)
                    `
                }}
            >

                {/* Labels */}
                <div className="absolute top-2 left-2 z-20 bg-background/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                    <span className="text-sm font-semibold text-foreground">Before</span>
                </div>
                <div className="absolute top-2 right-2 z-20 bg-background/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                    <span className="text-sm font-semibold text-foreground">After</span>
                </div>

                {/* Before Image (Static) */}
                <div className="absolute inset-0">
                    <video
                        src="https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_5.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* After Video with Clip Path */}
                <div
                    className="absolute inset-0 transition-all duration-100 ease-out"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src="https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_5.webp"
                        alt="Before - Original Product"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Enhanced Vertical Divider Line */}
                <div
                    className="absolute top-0 bottom-0 w-[3px] transition-all duration-100 ease-out z-30"
                    style={{ left: `${sliderPosition}%` }}
                >
                    {/* Outer glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white/60 blur-sm" />

                    {/* Main line */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/90 to-white/70 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />

                    {/* Draggable Thumb */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/95 border-4 border-white/30 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-grab active:cursor-grabbing flex items-center justify-center group backdrop-blur-sm"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Inner glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full" />

                        {/* Hover glow */}
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Arrows */}
                        <div className="relative flex gap-1">
                            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="text-gray-700">
                                <path d="M8 1L3 7L8 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="text-gray-700">
                                <path d="M2 1L7 7L2 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </motion.div>
                </div>

                {/* Range Input (Invisible but Interactive) */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={handleSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing z-40"
                    aria-label="Comparison slider"
                />
            </div>
        </div>
    );
}
