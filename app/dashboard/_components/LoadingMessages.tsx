"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const LOADING_MESSAGES = [
    "Did you know? UGC videos get 10x more views than brand-created content on social media.",
    "92% of consumers trust UGC more than traditional advertising. You're creating trust right now! 🎯",
    "Your video is being optimized for maximum engagement... Looking good! ✨",
    "Products with UGC videos see a 144% increase in add-to-cart rates compared to those without.",
    "The UGC market is expected to reach $24 billion by 2025. You're part of the movement! 🚀",
    "Fun fact: 79% of people say user-generated content highly impacts their purchasing decisions.",
    "AI is analyzing the best cuts and transitions for your product... Almost there!",
    "Real UGC creators charge $300-$400 per video. Your AI Avatar just saved you hundreds! 💰",
    "Brands that use UGC see 29% higher web conversions than campaigns without it.",
    "Instagram posts with UGC have 4.5% higher conversion rates than non-UGC posts.",
    "Creating magic... Your AI-powered video will look like you spent hours in a professional studio. ✨",
    "The average UGC creator spends 2-4 hours per video. We're saving you hours of editing! ⏰",
    "AI Avatars deliver authentic UGC at 90% lower cost than hiring real creators. Scale faster! 🚀",
    "While you wait: 85% of users find visual UGC more influential than brand photos or videos.",
    "Polishing the final touches... Your video is going to look incredible! 🎬",
    "UGC content generates 6.9x higher engagement than brand-generated content on Facebook.",
    "Shoppers who interact with UGC experience a 102% increase in conversions. That's your impact!",
    "With AI Avatars, create unlimited UGC videos without booking schedules or reshoot costs. Pure freedom! ✨",
    "Finalizing your masterpiece... Get ready to share something amazing! 🚀",
    "Video UGC has 10x higher ROI compared to influencer content. You're creating pure gold! 💰",
    "Did you know? 64% of consumers want more video content from brands they support.",
    "Your AI is crafting the perfect hook... First impressions matter! 🎯",
    "UGC videos have 5x higher click-through rates than standard ads on social platforms.",
    "Consumers spend 5.4x more time with UGC than with branded content. You're building engagement!",
    "Almost ready... Adding that authentic touch that makes UGC so powerful! ✨",
    "Brands using UGC see a 50% drop in cost-per-click compared to traditional ads.",
    "90% of consumers say authenticity matters when deciding which brands to support. You've got it! 🎬",
    "Your video is in the final stages... This is going to convert like crazy! 🚀",
    "UGC-based ads get 4x higher click rates and cost 50% less than average Facebook ads.",
    "Fun fact: User-generated videos are shared 1200% more than text and images combined!",
    "Fine-tuning every detail... Your audience won't believe this was AI-generated! 💰",
    "73% of consumers say they're more likely to purchase after watching product UGC videos.",
    "E-commerce sites with UGC see 18% higher revenue compared to those without.",
    "Getting closer... Your AI Avatar is bringing your product story to life! ✨",
    "Traditional video production costs $1,000-$10,000. You're creating pro content for a fraction!",
    "Videos with real people (or AI Avatars!) increase purchase intent by 97%. That's impact! 🎯",
    "Your masterpiece is taking shape... Excellence takes a moment! 🚀",
    "Mobile users are 3x more likely to engage with UGC video content than desktop users.",
    "86% of businesses now use video as a marketing tool. You're staying ahead of the curve!",
    "Rendering the perfect transitions... Every second will keep viewers hooked! 🎬",
    "UGC videos generate 10x more YouTube views than content uploaded by brands themselves.",
    "Consumers are 2.4x more likely to view UGC as authentic compared to brand content.",
    "Almost there... Your AI-powered UGC video is nearly ready to launch! ✨",
    "Product videos increase purchases by 144%. You're about to boost your conversions!",
    "78% of consumers want brands to create video content. You're giving them what they want! 💰",
    "Optimizing for social algorithms... This video is built to perform! 🚀",
    "Fun fact: Viewers retain 95% of a message when watching video vs. 10% when reading text.",
    "UGC creators typically take 1-2 weeks for delivery. You're getting yours in minutes! ⚡",
    "Final touches being applied... Your video is going to look absolutely stunning! 🎯",
    "Landing pages with videos convert 80% better than those without. Smart move!",
    "Social media posts with video get 48% more views than those with just images.",
    "Wrapping up... Your authentic AI UGC video is seconds away! ✨",
    "Brands that use video grow revenue 49% faster than those that don't. You're growing!",
    "88% of people have been convinced to buy after watching a brand's video. That's you now! 🎬",
    "Get ready... Your professional UGC video is almost complete! 🚀",
    "Video content gets 1200% more shares than text and images combined. Prepare for virality!",
    "No more waiting weeks for creators or paying premium rates. AI Avatars change everything! 💰",
    "The moment is here... Your video is finalizing now! ✨",
    "54% of consumers want to see more video content from brands. You're delivering!",
    "And... done! Your AI-powered UGC video is ready to convert! 🎉"
];

export default function LoadingMessages() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 5000); // 5 seconds per message

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="mt-8 flex flex-col items-center max-w-md mx-auto animate-in fade-in duration-700">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                <span className="text-xs uppercase tracking-wider text-brand-primary font-semibold">
                    Did you know?
                </span>
            </div>
            <p className="text-sm text-center text-muted-foreground leading-relaxed min-h-[60px] flex items-center justify-center transition-all duration-500 ease-in-out px-4">
                &quot;{LOADING_MESSAGES[currentIndex]}&quot;
            </p>
        </div>
    );
}
