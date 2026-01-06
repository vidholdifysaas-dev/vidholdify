/**
 * Scrape.do Integration for Product Page Scraping
 * 
 * This service provides reliable web scraping using scrape.do API
 * as an alternative/fallback to TopView's built-in scraper.
 * 
 * Required env variable: SCRAPE_DO_API_KEY
 */

import axios from "axios";

const SCRAPE_DO_API_KEY = process.env.SCRAPE_DO_API_KEY;
const SCRAPE_DO_BASE_URL = "https://api.scrape.do";

export interface ScrapeDoResponse {
    success: boolean;
    html?: string;
    error?: string;
    statusCode?: number;
}

export interface ProductData {
    title: string;
    description?: string;
    images: string[];
    price?: string;
    brand?: string;
}

/**
 * Check if scrape.do is configured
 */
export function isConfigured(): boolean {
    return !!SCRAPE_DO_API_KEY;
}

/**
 * Scrape a URL using scrape.do
 * @param url - The URL to scrape
 * @param options - Additional scraping options
 */
export async function scrapeUrl(
    url: string,
    options: {
        render?: boolean; // Enable JavaScript rendering
        geoCode?: string; // Country code for geo-targeting
        superProxy?: boolean; // Use residential proxies
        waitTime?: number; // Wait time in ms after page load
    } = {}
): Promise<ScrapeDoResponse> {
    if (!SCRAPE_DO_API_KEY) {
        return { success: false, error: "SCRAPE_DO_API_KEY is not configured" };
    }

    try {
        const params: Record<string, string> = {
            token: SCRAPE_DO_API_KEY,
            url: url,
        };

        // Add optional parameters
        if (options.render) params.render = "true";
        if (options.geoCode) params.geoCode = options.geoCode;
        if (options.superProxy) params.super = "true";
        if (options.waitTime) params.waitTime = options.waitTime.toString();

        console.log("[ScrapeD0] Scraping URL:", url);

        const response = await axios.get(SCRAPE_DO_BASE_URL, {
            params,
            timeout: 60000, // 60 second timeout
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        console.log("[ScrapeD0] ✅ Successfully scraped URL");

        return {
            success: true,
            html: response.data,
            statusCode: response.status,
        };
    } catch (error: unknown) {
        console.error("[ScrapeD0] ❌ Scraping failed:", error);
        const message = error instanceof Error ? error.message : "Scraping failed";
        return { success: false, error: message };
    }
}

/**
 * Extract product images from HTML
 * Supports common e-commerce platforms
 */
export function extractProductImages(html: string, baseUrl: string): string[] {
    const images: string[] = [];
    const seenUrls = new Set<string>();

    // Common image patterns for e-commerce sites
    const patterns = [
        // Amazon patterns
        /data-old-hires="([^"]+)"/gi,
        /data-a-dynamic-image="\{([^}]+)\}"/gi,
        /hiRes":"([^"]+)"/gi,
        /large":"([^"]+)"/gi,

        // Generic high-res image patterns
        /<meta\s+property="og:image"\s+content="([^"]+)"/gi,
        /<meta\s+name="twitter:image"\s+content="([^"]+)"/gi,

        // Product gallery patterns
        /data-zoom-image="([^"]+)"/gi,
        /data-large-image="([^"]+)"/gi,
        /data-src="([^"]+)"/gi,

        // Standard image tags with product-related classes
        /<img[^>]+class="[^"]*(?:product|gallery|main|hero|primary)[^"]*"[^>]+src="([^"]+)"/gi,

        // JSON-LD structured data
        /"image"\s*:\s*"([^"]+)"/gi,
        /"image"\s*:\s*\[\s*"([^"]+)"/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            let url = match[1];

            // Clean up URL
            url = url.replace(/\\u002F/g, "/").replace(/\\/g, "");

            // Handle relative URLs
            if (url.startsWith("//")) {
                url = "https:" + url;
            } else if (url.startsWith("/")) {
                try {
                    const urlObj = new URL(baseUrl);
                    url = urlObj.origin + url;
                } catch {
                    continue;
                }
            }

            // Validate URL
            try {
                new URL(url);
            } catch {
                continue;
            }

            // Filter out small images, icons, logos
            if (
                url.includes("sprite") ||
                url.includes("icon") ||
                url.includes("logo") ||
                url.includes("badge") ||
                url.includes("1x1") ||
                url.includes("pixel") ||
                url.includes("tracking") ||
                url.includes(".gif") ||
                url.includes("_SS40") ||
                url.includes("_SR38") ||
                url.includes("_AC_US40")
            ) {
                continue;
            }

            // Only add unique URLs
            if (!seenUrls.has(url)) {
                seenUrls.add(url);
                images.push(url);
            }
        }
    }

    // Also extract from standard img tags as fallback
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
        let url = imgMatch[1];

        // Skip small images and tracking pixels
        if (
            url.includes("1x1") ||
            url.includes("pixel") ||
            url.includes("tracking") ||
            url.includes(".gif") ||
            url.includes("sprite") ||
            url.includes("icon") ||
            url.length < 20
        ) {
            continue;
        }

        // Handle relative URLs
        if (url.startsWith("//")) {
            url = "https:" + url;
        } else if (url.startsWith("/")) {
            try {
                const urlObj = new URL(baseUrl);
                url = urlObj.origin + url;
            } catch {
                continue;
            }
        }

        // Check if it looks like a product image (larger dimensions in URL)
        const looksLikeProductImage =
            url.includes("product") ||
            url.includes("large") ||
            url.includes("main") ||
            /\d{3,4}x\d{3,4}/.test(url) ||
            url.includes("_AC_SL") ||
            url.includes("_AC_UL") ||
            url.includes("_SX") ||
            url.includes("_SY");

        if (looksLikeProductImage && !seenUrls.has(url)) {
            seenUrls.add(url);
            images.push(url);
        }
    }

    // Limit to first 20 images to avoid overwhelming the UI
    return images.slice(0, 20);
}

/**
 * Extract product title from HTML
 */
export function extractProductTitle(html: string): string | null {
    // Try common patterns
    const patterns = [
        // Amazon
        /<span[^>]+id="productTitle"[^>]*>([^<]+)</i,
        // Generic
        /<h1[^>]*class="[^"]*(?:product|title)[^"]*"[^>]*>([^<]+)</i,
        /<meta\s+property="og:title"\s+content="([^"]+)"/i,
        /<title>([^<]+)</i,
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    return null;
}

/**
 * Full product scraping with scrape.do
 * This combines URL scraping with product data extraction
 */
export async function scrapeProduct(url: string): Promise<{
    success: boolean;
    productName?: string;
    images?: string[];
    error?: string;
}> {
    // Determine if we need JavaScript rendering based on URL
    const needsRendering =
        url.includes("shopify") ||
        url.includes("wix") ||
        url.includes("squarespace") ||
        url.includes("bigcommerce");

    const scrapeResult = await scrapeUrl(url, {
        render: needsRendering,
        superProxy: true, // Use residential proxies for better success rate
        waitTime: needsRendering ? 3000 : 1000,
    });

    if (!scrapeResult.success || !scrapeResult.html) {
        return { success: false, error: scrapeResult.error || "Failed to scrape URL" };
    }

    const images = extractProductImages(scrapeResult.html, url);
    const productName = extractProductTitle(scrapeResult.html);

    if (images.length === 0) {
        return { success: false, error: "No product images found on this page" };
    }

    return {
        success: true,
        productName: productName || undefined,
        images,
    };
}
