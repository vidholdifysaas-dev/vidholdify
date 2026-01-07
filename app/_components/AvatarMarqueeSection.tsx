"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ============================================
// TYPES
// ============================================

interface AvatarImage {
    id: string;
    url: string;
    description: string;
    source?: 's3' | 'topview';
}

// ============================================
// MARQUEE ROW COMPONENT
// ============================================

function MarqueeRow({
    images,
    direction = "left",
    speed = 20,
    className
}: {
    images: AvatarImage[];
    direction?: "left" | "right";
    speed?: number; // Duration in seconds
    className?: string;
}) {
    // Duplicate images to create seamless loop
    const duplicatedImages = [...images, ...images, ...images];

    return (
        <div className={cn("flex overflow-hidden relative w-full", className)}>
            <motion.div
                className="flex gap-4 min-w-max"
                animate={{
                    x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
                }}
                transition={{
                    duration: speed,
                    ease: "linear",
                    repeat: Infinity,
                }}
            >
                {duplicatedImages.map((img, index) => (
                    <div
                        key={`${img.id}-${index}`}
                        className="relative w-[120px] h-[180px] sm:w-[150px] sm:h-[220px] rounded-xl overflow-hidden border border-white/10 shadow-lg hover:border-brand-primary/50 transition-colors group bg-white/5"
                    >
                        {img.url ? (
                            <Image
                                src={img.url}
                                alt={img.description}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="(max-width: 640px) 120px, 150px"
                            />
                        ) : (
                            <div className="w-full h-full animate-pulse bg-white/10" />
                        )}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AvatarMarqueeSection() {
    const [avatars, setAvatars] = useState<AvatarImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                // Fetch from S3 folders in parallel
                // Folder 'prebuilt' -> Your custom avatars
                // Folder 'topview' -> Synced TopView avatars
                const [s3Res, tvRes] = await Promise.allSettled([
                    axios.get("/api/avatars/list?folder=prebuilt&limit=100"),
                    axios.get("/api/avatars/list?folder=topview&limit=100")
                ]);

                let s3Combined: AvatarImage[] = [];
                let tvCombined: AvatarImage[] = [];

                // 1. Process Prebuilt (S3)
                if (s3Res.status === "fulfilled") {
                    const data = s3Res.value.data.avatars || [];
                    s3Combined = data.map((item: any, idx: number) => ({
                        id: item.key || `s3-${idx}`,
                        url: item.url,
                        description: item.fileName?.split('/').pop()?.split('.')[0].replace(/[-_]/g, ' ') || "AI Avatar",
                        source: 's3'
                    }));
                }

                // 2. Process TopView (S3 Synced)
                if (tvRes.status === "fulfilled") {
                    const data = tvRes.value.data.avatars || [];
                    tvCombined = data.map((item: any, idx: number) => ({
                        id: item.key || `tv-${idx}`,
                        url: item.url,
                        description: "Professional Avatar",
                        source: 'topview'
                    }));
                }

                // Combine both sources
                const allAvatars = [...s3Combined, ...tvCombined];

                // Shuffle everything together
                for (let i = allAvatars.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allAvatars[i], allAvatars[j]] = [allAvatars[j], allAvatars[i]];
                }

                setAvatars(allAvatars);

            } catch (error) {
                console.error("Failed to fetch avatars info:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvatars();
    }, []);

    // Split avatars into 3 balanced rows
    const row1 = avatars.filter((_, i) => i % 3 === 0);
    const row2 = avatars.filter((_, i) => i % 3 === 1);
    const row3 = avatars.filter((_, i) => i % 3 === 2);

    // If loading, show section with fixed height skeleton to prevent layout shift
    // If empty after loading, return nothing (or keep placeholder?)
    if (!loading && avatars.length === 0) return null;

    // Use skeleton placeholders if loading
    const displayAvatars = loading ? Array(15).fill({ id: 'skel', url: '', description: '' }) : [];

    // Fallback logic not strictly needed if we just use the split rows, 
    // but ensures rows aren't empty if we have very little data
    const finalRow1 = loading ? displayAvatars : (row1.length > 0 ? row1 : avatars);
    const finalRow2 = loading ? displayAvatars : (row2.length > 0 ? row2 : avatars);
    const finalRow3 = loading ? displayAvatars : (row3.length > 0 ? row3 : avatars);

    return (
        <section className="py-20 relative overflow-hidden">

            <div className="container mx-auto px-4 mb-12 text-center relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-geist">
                        Diverse AI Avatars
                    </h2>
                    <p className="text-lg text-muted-foreground mx-auto max-w-2xl">
                        High-quality, realistic avatars ready to represent your brand. Mix, match, and create engaging content instantly.
                    </p>
                </motion.div>
            </div>

            <div className="space-y-6 md:space-y-8 relative z-0 opacity-100 hover:opacity-100 transition-opacity duration-500">
                {/* Row 1 - Left */}
                <MarqueeRow
                    images={finalRow1}
                    direction="left"
                    speed={Math.max(finalRow1.length * 20, 100)}
                />

                {/* Row 2 - Right */}
                <MarqueeRow
                    images={finalRow2}
                    direction="right"
                    speed={Math.max(finalRow2.length * 20, 120)}
                />

                {/* Row 3 - Left */}
                <MarqueeRow
                    images={finalRow3}
                    direction="left"
                    speed={Math.max(finalRow3.length * 20, 110)}
                />
            </div>
        </section>
    );
}
