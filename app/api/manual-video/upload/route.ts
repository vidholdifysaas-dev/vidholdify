/**
 * Upload Image API Route for Manual Video
 * 
 * POST /api/manual-video/upload
 * 
 * Handles image uploads for avatar and product images.
 * Uploads to S3 and returns the public URL.
 * 
 * INPUT (FormData):
 * - file: File (required) - The image file to upload
 * - type: "avatar" | "product" (required) - Type of image
 * 
 * OUTPUT:
 * {
 *   success: boolean,
 *   url: string - Public S3 URL
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { uploadToS3 } from "@/configs/s3";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
];

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const type = formData.get("type") as string | null;

        // Validate file
        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Validate type
        if (!type || !["avatar", "product"].includes(type)) {
            return NextResponse.json(
                { success: false, error: "Type must be 'avatar' or 'product'" },
                { status: 400 }
            );
        }

        // Generate unique file name
        const fileId = randomUUID();
        const extension = file.name.split(".").pop() || "jpg";
        const fileName = `${fileId}.${extension}`;

        // Build S3 key
        const s3Key = `manual-video/${userId}/${type}s/${fileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        const url = await uploadToS3(s3Key, buffer, file.type);

        console.log(`[API] Uploaded ${type} image: ${url}`);

        return NextResponse.json({
            success: true,
            url,
            fileId,
        });
    } catch (error) {
        console.error("[API] Upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to upload image",
            },
            { status: 500 }
        );
    }
}
