"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

// Video data from AnySizeSection
const VIDEOS = [
    { id: 0, videoSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_0.mp4", posterSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_0.webp", rotation: "rotate-3" },
    { id: 1, videoSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_1.mp4", posterSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_1.webp", rotation: "-rotate-3" },
    { id: 2, videoSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_20.mp4", posterSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_20.webp", rotation: "rotate-3" },
    { id: 3, videoSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/result_15.mp4", posterSrc: "https://d1735p3aqhycef.cloudfront.net/official-website/public/landing-page/home/init_15.webp", rotation: "-rotate-3" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex bg-background overflow-hidden">
            {/* LEFT SIDE - BRANDING & VISUALS */}
            <div className="hidden lg:flex w-1/2 relative flex-col p-8">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-brand-primary/10 via-purple-600/5 to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[80px] -z-10" />

                {/* Content Container */}
                <div className="relative z-10 flex flex-col h-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <Image
                            src="/Full_logo.svg"
                            alt="Vidholdify Logo"
                            width={160}
                            height={30}
                            className="object-contain"
                        />
                    </Link>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col justify-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-sm font-medium mb-6 w-fit backdrop-blur-sm">
                            <Sparkles className="w-4 h-4 text-brand-primary" />
                            <span>AI-Powered Product Videos</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-3xl xl:text-5xl font-bold text-white mb-4 leading-tight">
                            Create AI UGC Videos{" "}
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-brand-primary to-purple-600 text-white rounded-lg shadow-lg shadow-brand-primary/30 transform -rotate-1">
                                in Minutes
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-5 max-w-md">
                            Stunning and ready-to-use AI UGC videos delivered while your coffee is still hot.
                        </p>

                        {/* Video Row with Rotation */}
                        <div className="flex items-center justify-start gap-4">
                            {VIDEOS.map((video, index) => (
                                <div
                                    key={video.id}
                                    className={`w-[140px] h-[220px] xl:w-[160px] xl:h-[260px] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl transition-transform duration-300 hover:scale-105 ${video.rotation}`}
                                    style={{
                                        marginTop: index % 2 === 0 ? '0' : '20px',
                                        zIndex: 10 + index
                                    }}
                                >
                                    <video
                                        src={video.videoSrc}
                                        poster={video.posterSrc}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-4 mt-8">
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} className="text-amber-400 text-lg">★</span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400">Trusted by 500+ creators worldwide</p>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-3 py-6 sm:p-6 lg:p-12 relative z-10 bg-black/60 backdrop-blur-md lg:border-l border-white/5 min-h-screen lg:min-h-0 overflow-x-hidden">
                {/* Background glow for right side */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[120px] -z-10" />

                <div className="w-full max-w-[calc(100%-8px)] sm:max-w-md mx-auto bg-black/30 backdrop-blur-xl border border-white/10 p-3 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl animate-in fade-in duration-500 box-border">
                    {/* Mobile Logo (visible only on small screens) */}
                    <div className="lg:hidden flex justify-center mb-6 sm:mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/Full_logo.svg"
                                alt="Vidholdify Logo"
                                width={120}
                                height={32}
                                className="h-8 w-auto object-contain"
                            />
                        </Link>
                    </div>

                    {/* Desktop Logo (centered at top, visible only on large screens) */}
                    <div className="hidden lg:flex items-center justify-center gap-2 mb-8">
                        <Image
                            src="/Full_logo.svg"
                            alt="Vidholdify Logo"
                            width={150}
                            height={40}
                            className="object-contain h-10 w-auto"
                        />
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}

