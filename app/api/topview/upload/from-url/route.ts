export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

const TOPVIEW_API_KEY = process.env.TOPVIEW_API_KEY!;
const TOPVIEW_UID = process.env.TOPVIEW_UID!;
const BASE_URL = process.env.TOPVIEW_BASE_URL!;

/**
 * Upload an image from URL to TopView's system
 * This is used for lazy upload of scrape.do images when user selects one
 * 
 * Returns a valid TopView fileId that can be used with background removal
 */
export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        console.log("📤 Uploading image to TopView:", imageUrl.substring(0, 100) + "...");

        // Step 1: Get upload credentials from TopView
        const credResponse = await axios.get(`${BASE_URL}/v1/upload/credential`, {
            params: { format: "jpg" },
            headers: {
                Authorization: `Bearer ${TOPVIEW_API_KEY}`,
                "Topview-Uid": TOPVIEW_UID,
            },
        });

        if (credResponse.data.code !== "200") {
            console.error("❌ Failed to get TopView credentials:", credResponse.data);
            return NextResponse.json(
                { error: "Failed to get upload credentials" },
                { status: 500 }
            );
        }

        const { uploadUrl, fileId } = credResponse.data.result;
        console.log(`📝 Got TopView credentials, fileId: ${fileId}`);

        // Step 2: Download image from the scraped URL
        const imageResponse = await axios.get(imageUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/*,*/*;q=0.8",
                "Referer": new URL(imageUrl).origin,
            },
        });

        const imageBuffer = Buffer.from(imageResponse.data);
        const contentType = imageResponse.headers["content-type"] || "image/jpeg";

        console.log(`📥 Downloaded image: ${imageBuffer.length} bytes, type: ${contentType}`);

        // Step 3: Upload to TopView's S3
        await axios.put(uploadUrl, imageBuffer, {
            headers: {
                "Content-Type": contentType,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        console.log(`✅ Image uploaded to TopView successfully, fileId: ${fileId}`);

        // Step 4: Get CloudFront URL for display (optional, for confirmation)
        let cloudFrontUrl = imageUrl;
        try {
            const checkResponse = await axios.get(`${BASE_URL}/v1/upload/check`, {
                params: {
                    fileId,
                    needCloudFrontUrl: "true",
                },
                headers: {
                    Authorization: `Bearer ${TOPVIEW_API_KEY}`,
                    "Topview-Uid": TOPVIEW_UID,
                },
            });

            if (checkResponse.data.code === "200" && checkResponse.data.result?.cloudFrontUrl) {
                cloudFrontUrl = checkResponse.data.result.cloudFrontUrl;
            }
        } catch (checkError) {
            console.warn("⚠️ Could not get CloudFront URL:", checkError);
            // Continue anyway, fileId is the important part
        }

        return NextResponse.json({
            success: true,
            fileId: fileId,
            fileUrl: cloudFrontUrl,
            message: "Image uploaded to TopView successfully",
        });
    } catch (error) {
        console.error("❌ Image upload to TopView failed:", error);

        // Provide more specific error messages
        let errorMessage = "Failed to upload image";
        if (axios.isAxiosError(error)) {
            if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
                errorMessage = "Could not connect to image source";
            } else if (error.response?.status === 403) {
                errorMessage = "Image source blocked the download";
            } else if (error.response?.status === 404) {
                errorMessage = "Image not found at the source";
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
