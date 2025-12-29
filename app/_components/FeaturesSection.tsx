"use client";

import { ArrowRight, Box, Play, Mic, Sparkles, Globe, Type, Volume2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CaptionStyles } from "@/dataUtils/Captionstyles";

// ---------- BENTO CARD COMPONENT ----------
const BentoCard = ({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
    gradient = false,
}: {
    title?: string;
    subtitle?: string;
    icon?: React.ElementType;
    children?: React.ReactNode;
    className?: string;
    gradient?: boolean;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`group relative rounded-2xl border border-border/50 backdrop-blur-xl p-5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/10 ${gradient
                ? "bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border-brand-primary/30"
                : "bg-card/30"
                } ${className}`}
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {title && (
                <div className="flex items-center gap-2 mb-2 relative z-10">
                    {Icon && (
                        <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                </div>
            )}
            {subtitle && <p className="text-sm text-muted-foreground mb-4 relative z-10">{subtitle}</p>}
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

// ---------- ANIMATED WAVEFORM COMPONENT ----------
const AnimatedWaveform = () => {
    return (
        <div className="flex items-end gap-1">
            {[0, 1, 2, 3, 4].map((bar, idx) => (
                <motion.div
                    key={idx}
                    initial={{ height: 8 }}
                    animate={{ height: [8 + (idx % 3) * 6, 28 - (idx % 2) * 6, 12 + (idx % 4) * 4] }}
                    transition={{
                        delay: idx * 0.08,
                        duration: 0.9,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                    style={{ width: 4 }}
                    className="bg-brand-primary rounded"
                    aria-hidden
                />
            ))}
        </div>
    );
};

const FEATURES = [
    {
        title: "Product Avatar Generator",
        description: "Create an avatar holding your product with one image.",
        imageSrc: "/Image1.png",
        link: "/dashboard",
        badge: "New",
        icon: Box,
    },
    {
        title: "Video Avatar Generator",
        description: "Generate avatar videos from 1000+ different Avatars or upload or describe your own Avatar.",
        imageSrc: "/Image4.png",
        link: "/dashboard",
        icon: Play,
    },
    {
        title: "Avatar to Video",
        description: "Turn Avatar into a talking video with some clicks.",
        imageSrc: "/Image3.png",
        link: "/dashboard",
        icon: Mic,
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

export default function FeaturesSection() {
    return (
        <section id="features" className="relative w-full py-16 flex flex-col items-center overflow-hidden">

            {/* ✅ Background Glows - Matching Hero Style */}
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 -z-10" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 -z-10" />


            {/* Header */}
            <div className="max-w-4xl mx-auto text-center px-6 mb-16 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-muted-foreground text-sm font-medium mb-8 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-brand-primary" />
                        <span>AI-Powered Creation</span>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        More Than    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-600"> Product Avatar </span> Generator
                    </h2>
                    <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
                        All-in-one AI avatar generators that effortlessly transform products, photos, and videos into unique AI avatars.
                    </p>
                </motion.div>
            </div>

            {/* Grid */}
            <div className="w-full max-w-7xl mx-auto px-6 z-10">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-6 gap-6"
                >
                    {/* Existing 3 Feature Cards - Each takes 2 columns */}
                    {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                variants={item}
                                className="md:col-span-2 group relative flex flex-col bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 hover:-translate-y-2"
                            >
                                {/* Card Glow Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="relative aspect-[4/3] w-full bg-muted/30 overflow-hidden p-6">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={feature.imageSrc}
                                            alt={feature.title}
                                            fill
                                            className="object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-xl"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>

                                    {feature.badge && (
                                        <div className="absolute top-4 right-4 bg-gradient-to-r from-brand-primary-dark to-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                            {feature.badge}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-1 relative">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            {feature.title}
                                        </h3>
                                    </div>

                                    <p className="text-muted-foreground mb-6 flex-1 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>

                                    <Link href="/dashboard" className="inline-block mt-auto">
                                        <button className="text-sm font-semibold text-brand-primary hover:text-brand-primary-light transition-colors flex items-center gap-2 group/btn">
                                            Try now
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* 🎨 CAPTION STYLES - Premium 3-row scrolling showcase */}
                    <BentoCard
                        title="Caption Styles"
                        subtitle="21+ stunning caption styles with accurate transcriptions"
                        icon={Type}
                        className="md:col-span-3"
                        gradient
                    >
                        <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gradient-to-br from-black/40 to-brand-primary/10">
                            {/* Row 1 - Styles 1-7 scrolling left */}
                            <div className="absolute top-2 left-0 right-0 overflow-hidden">
                                <motion.div
                                    className="flex gap-2"
                                    animate={{ x: ["0%", "-100%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 50,
                                        ease: "linear",
                                    }}
                                >
                                    {[...CaptionStyles.slice(0, 7), ...CaptionStyles.slice(0, 7), ...CaptionStyles.slice(0, 7), ...CaptionStyles.slice(0, 7)].map((style, i) => (
                                        <div
                                            key={`row1-${i}`}
                                            className="flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border border-white/10 bg-black/30 shadow-lg"
                                        >
                                            <img
                                                src={style.thumbnail}
                                                alt="Caption Style"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Row 2 - Styles 8-14 scrolling right */}
                            <div className="absolute top-[4.5rem] left-0 right-0 overflow-hidden">
                                <motion.div
                                    className="flex gap-2"
                                    animate={{ x: ["-100%", "0%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 50,
                                        ease: "linear",
                                    }}
                                >
                                    {[...CaptionStyles.slice(7, 14), ...CaptionStyles.slice(7, 14), ...CaptionStyles.slice(7, 14), ...CaptionStyles.slice(7, 14)].map((style, i) => (
                                        <div
                                            key={`row2-${i}`}
                                            className="flex-shrink-0 w-28 h-14 rounded-lg overflow-hidden border border-brand-primary/30 bg-black/30 shadow-xl ring-1 ring-brand-primary/20"
                                        >
                                            <img
                                                src={style.thumbnail}
                                                alt="Caption Style"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Row 3 - Styles 15-21 scrolling left */}
                            <div className="absolute top-[8.5rem] left-0 right-0 overflow-hidden">
                                <motion.div
                                    className="flex gap-2"
                                  animate={{ x: ["0%", "-100%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 50,
                                        ease: "linear",
                                    }}
                                >
                                    {[...CaptionStyles.slice(14, 21), ...CaptionStyles.slice(14, 21), ...CaptionStyles.slice(14, 21), ...CaptionStyles.slice(14, 21)].map((style, i) => (
                                        <div
                                            key={`row3-${i}`}
                                            className="flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border border-white/10 bg-black/30 shadow-lg"
                                        >
                                            <img
                                                src={style.thumbnail}
                                                alt="Caption Style"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Premium gradient overlays */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

                            {/* Badge overlay */}
                            <div className="absolute bottom-3 left-3 z-10">
                                <span className="text-xs px-3 py-1.5 rounded-full bg-brand-primary/50 text-white font-medium border border-brand-primary/60 backdrop-blur-md shadow-lg">
                                    ✨ 21+ Premium Styles
                                </span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 🎤 NARRATION VOICES - Takes 3 columns */}
                    <BentoCard
                        title="Narration Voices"
                        subtitle="Crisp studio voices in 8+ languages"
                        icon={Volume2}
                        className="md:col-span-3"
                    >
                        <div className="space-y-2">
                            {[
                                { name: "Brian", accent: "American", flag: "🇺🇸" },
                                { name: "Natasha", accent: "British", flag: "🇬🇧" },
                                { name: "Adam", accent: "Australian", flag: "🇦🇺" },
                            ].map((voice, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl bg-muted/30 border border-border/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-base">
                                            {voice.flag}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{voice.name}</p>
                                            <p className="text-xs text-muted-foreground">Narration · {voice.accent}</p>
                                        </div>
                                    </div>
                                    <AnimatedWaveform />
                                </div>
                            ))}
                        </div>
                    </BentoCard>

                    {/* 🌍 8+ LANGUAGES - Full Width with Infinite Scroll */}
                    <BentoCard
                        title="8+ Languages"
                        subtitle="Auto-translated captions for global reach"
                        icon={Globe}
                        className="md:col-span-6"
                    >
                        <div className="h-20 overflow-hidden relative">
                            <motion.div
                                className="flex gap-4"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 20,
                                    ease: "linear",
                                }}
                            >
                                {/* First set of languages */}
                                {[
                                    { lang: "English", flag: "🇺🇸" },
                                    { lang: "Spanish", flag: "🇪🇸" },
                                    { lang: "French", flag: "🇫🇷" },
                                    { lang: "German", flag: "🇩🇪" },
                                    { lang: "Japanese", flag: "🇯🇵" },
                                    { lang: "Hindi", flag: "🇮🇳" },
                                    { lang: "Arabic", flag: "🇸🇦" },
                                    { lang: "Portuguese", flag: "🇧🇷" },
                                    { lang: "Korean", flag: "🇰🇷" },
                                    { lang: "Chinese", flag: "🇨🇳" },
                                    { lang: "Italian", flag: "🇮🇹" },
                                    { lang: "Dutch", flag: "🇳🇱" },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                                    >
                                        <span className="text-xl">{item.flag}</span>
                                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.lang}</span>
                                    </div>
                                ))}
                                {/* Duplicate for seamless loop */}
                                {[
                                    { lang: "English", flag: "🇺🇸" },
                                    { lang: "Spanish", flag: "🇪🇸" },
                                    { lang: "French", flag: "🇫🇷" },
                                    { lang: "German", flag: "🇩🇪" },
                                    { lang: "Japanese", flag: "🇯🇵" },
                                    { lang: "Hindi", flag: "🇮🇳" },
                                    { lang: "Arabic", flag: "🇸🇦" },
                                    { lang: "Portuguese", flag: "🇧🇷" },
                                    { lang: "Korean", flag: "🇰🇷" },
                                    { lang: "Chinese", flag: "🇨🇳" },
                                    { lang: "Italian", flag: "🇮🇹" },
                                    { lang: "Dutch", flag: "🇳🇱" },
                                ].map((item, i) => (
                                    <div
                                        key={`dup-${i}`}
                                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all"
                                    >
                                        <span className="text-xl">{item.flag}</span>
                                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.lang}</span>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </BentoCard>

                </motion.div>
            </div>

        </section>
    );
}
