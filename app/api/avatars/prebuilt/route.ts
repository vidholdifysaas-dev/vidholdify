import { NextRequest, NextResponse } from "next/server";
import { listS3Folder, getSignedPlaybackUrl } from "@/configs/s3";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "24");
        const offset = (page - 1) * limit;

        // 1. List all objects in the avatars/prebuilt folder
        // Note: For < 1000 items, one call is enough. If > 1000, we'd need multiple calls or continuation tokens.
        const prefix = "avatars/prebuilt/";
        const allKeys = await listS3Folder(prefix);

        // 2. Paginate keys
        const paginatedKeys = allKeys.slice(offset, offset + limit);

        // 3. Generate signed URLs for only the requested page
        const results = await Promise.allSettled(
            paginatedKeys.map(async (key) => {
                const url = await getSignedPlaybackUrl(key, 3600); // Valid for 1 hour
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

        console.log(`Page ${page}: Fetched ${avatars.length} avatars (Total available: ${allKeys.length})`);

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
                "Cache-Control": "no-store, max-age=0",
            }
        });
    } catch (error) {
        console.error("Failed to fetch prebuilt avatars:", error);
        return NextResponse.json(
            { error: "Failed to fetch avatars" },
            { status: 500 }
        );
    }
}
