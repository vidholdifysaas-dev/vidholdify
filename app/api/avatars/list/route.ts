import { NextRequest, NextResponse } from "next/server";
import { listS3Folder, getSignedPlaybackUrl } from "@/configs/s3";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const folder = searchParams.get("folder") || "prebuilt"; // 'prebuilt' or 'topview'
        const offset = (page - 1) * limit;

        // Determine prefix based on folder param
        const prefix = `avatars/${folder}/`;

        // 1. List all objects in the S3 folder
        const allKeys = await listS3Folder(prefix);

        // 2. Paginate keys
        const paginatedKeys = allKeys.slice(offset, offset + limit);

        // 3. Generate signed URLs
        const results = await Promise.allSettled(
            paginatedKeys.map(async (key) => {
                const url = await getSignedPlaybackUrl(key, 3600); // 1 hour
                return {
                    key,
                    url,
                    fileName: key.replace(prefix, ""),
                };
            })
        );

        const avatars = results
            .filter((result): result is PromiseFulfilledResult<{ key: string; url: string; fileName: string }> => result.status === "fulfilled")
            .map((result) => result.value);

        return NextResponse.json({
            avatars,
            pagination: {
                page,
                limit,
                total: allKeys.length,
                totalPages: Math.ceil(allKeys.length / limit)
            }
        }, {
            headers: {
                "Cache-Control": "public, max-age=60", // Cache for 1 min
            }
        });
    } catch (error) {
        console.error("Failed to fetch avatars list:", error);
        return NextResponse.json(
            { error: "Failed to fetch avatars" },
            { status: 500 }
        );
    }
}
