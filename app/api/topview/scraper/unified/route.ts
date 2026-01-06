export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import * as scrapeDo from "@/configs/scrape-do";

const TOPVIEW_API_KEY = process.env.TOPVIEW_API_KEY!;
const TOPVIEW_UID = process.env.TOPVIEW_UID!;
const BASE_URL = process.env.TOPVIEW_BASE_URL!;

interface ScrapedImage {
    fileId?: string;      // Only present if from TopView scraper
    fileName: string;
    fileUrl: string;
    originalUrl?: string; // Original URL for scrape.do images (needs upload later)
    source: "scrapedo" | "topview"; // Track source for later processing
}

/**
 * Unified scraper endpoint that tries scrape.do first, then falls back to TopView
 * 
 * For scrape.do: Returns original image URLs (lazy upload - only upload when user selects)
 * For TopView: Returns fileIds directly (already in their system)
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productLink, preferredMethod } = await request.json();

        if (!productLink) {
            return NextResponse.json(
                { error: "Product link is required" },
                { status: 400 }
            );
        }

        console.log("🔍 Starting product scrape for:", productLink);
        console.log("📋 Preferred method:", preferredMethod || "auto");

        // Strategy: Try scrape.do first if configured, fallback to TopView
        const shouldTryScrapeDo = scrapeDo.isConfigured() && preferredMethod !== "topview";
        const shouldTryTopView = preferredMethod !== "scrapedo";

        let result: {
            success: boolean;
            productName?: string;
            images?: ScrapedImage[];
            error?: string;
            method?: string;
        } = { success: false };

        // Try scrape.do first
        if (shouldTryScrapeDo) {
            console.log("🌐 Attempting scrape.do...");
            const scrapeResult = await scrapeDo.scrapeProduct(productLink);

            if (scrapeResult.success && scrapeResult.images && scrapeResult.images.length > 0) {
                console.log(`✅ scrape.do success! Found ${scrapeResult.images.length} images`);

                // Return images with original URLs - NO UPLOAD YET (lazy upload when user selects)
                const images: ScrapedImage[] = scrapeResult.images.slice(0, 12).map((url, index) => ({
                    fileName: `product_${index + 1}.jpg`,
                    fileUrl: url,         // Display URL
                    originalUrl: url,     // Original URL for later upload
                    source: "scrapedo" as const,
                }));

                result = {
                    success: true,
                    productName: scrapeResult.productName,
                    images: images,
                    method: "scrapedo",
                };
            } else {
                console.log("⚠️ scrape.do failed or found no images:", scrapeResult.error);
            }
        }

        // Fallback to TopView scraper if scrape.do failed
        if (!result.success && shouldTryTopView) {
            console.log("🔄 Falling back to TopView scraper...");

            try {
                const response = await axios.post(
                    `${BASE_URL}/v1/scraper/task/submit`,
                    { productLink },
                    {
                        headers: {
                            Authorization: `Bearer ${TOPVIEW_API_KEY}`,
                            "Topview-Uid": TOPVIEW_UID,
                            "Content-Type": "application/json",
                        },
                        timeout: 30000,
                    }
                );

                if (response.data.code === "200") {
                    console.log("✅ TopView scraper task submitted");

                    // Return task ID for polling
                    return NextResponse.json({
                        success: true,
                        method: "topview",
                        taskId: response.data.result.taskId,
                        status: "pending",
                        message: "Scraping in progress. Poll for results.",
                    });
                } else {
                    console.error("❌ TopView scraper submit failed:", response.data);
                    result = {
                        success: false,
                        error: "TopView scraper failed to start",
                    };
                }
            } catch (topviewError) {
                console.error("❌ TopView scraper error:", topviewError);
                result = {
                    success: false,
                    error: topviewError instanceof Error ? topviewError.message : "TopView scraper failed",
                };
            }
        }

        // Return final result
        if (result.success) {
            return NextResponse.json({
                success: true,
                method: result.method,
                productName: result.productName,
                productImages: result.images,
                status: "success",
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "All scraping methods failed",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("❌ Scraper unified error:", error);
        return NextResponse.json(
            {
                error: "Failed to scrape product",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
