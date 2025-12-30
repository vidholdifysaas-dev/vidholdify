import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
});

export interface NanoBananaRequest {
    prompt: string;                    // Full generation prompt
    avatarDescription?: string;        // Avatar/person description
    // productDescription removed
    backgroundDescription?: string;    // Scene/background
    aspectRatio?: "9:16" | "16:9" | "1:1" | "4:5" | "3:4"; // Video aspect ratio
    style?: string;                    // Art style (realistic, etc.)
    avatarImageUrl?: string;           // S3 URL of uploaded avatar image
    productImageUrl?: string;          // S3 URL of uploaded product image
}

export interface NanoBananaResult {
    success: boolean;
    taskId?: string;                   // For async generation
    imageUrl?: string;                 // Direct URL if sync
    status?: "pending" | "processing" | "completed" | "failed";
    error?: string;
}

export interface NanoBananaTaskStatus {
    status: "pending" | "processing" | "completed" | "failed";
    imageUrl?: string;
    error?: string;
    progress?: number; // 0-100
}

export function buildImagePrompt(params: {
    productName: string;
    avatarDescription?: string;
    productHoldingDescription?: string;
    backgroundDescription?: string;
    platform?: string;
    hasAvatarImage?: boolean;
    hasProductImage?: boolean;
    keepAvatarBackground?: boolean;
    aspectRatio?: string;
}): string {
    const {
        productName,
        avatarDescription = "a friendly, relatable person in their 20s-30s with a natural, authentic look",
        productHoldingDescription = "holding the product naturally, showing it to the camera",
        backgroundDescription = "a clean, real home environment with natural daytime lighting",
        platform = "TikTok",
        hasAvatarImage = false,
        hasProductImage = false,
        keepAvatarBackground = true,
        aspectRatio = "9:16",
    } = params;

    if (hasAvatarImage && hasProductImage) {
        return `Generate a high-quality, realistic UGC-style photo form the given avatar and product image in input.

Requirements:
- Do NOT modify the avatar’s face, background, lighting, or clothing.
- Keep the avatar exactly the same as in the reference image.
- Use the exact product from the product reference image — same shape, label, logo, and color.
- Photo should look realistic and natural, like a smartphone selfie
- The person should be holding the product naturally and facing the camera with a friendly smile.
- Aspect ratio: ${aspectRatio}`;
    }

    if (hasAvatarImage && !hasProductImage) {
        return `Generate a high-quality, realistic UGC-style photo for a ${platform} ad.

The avatar from the reference image is ${productHoldingDescription}.

REQUIREMENTS:
- The person must look EXACTLY like the avatar reference image (same face, hair, clothing)
- The person is holding a product called "${productName}"
- The person is looking directly at the camera with a natural, friendly smile
- The product "${productName}" must be clearly visible and readable
- Photo should look realistic and natural, like a smartphone selfie
- Aspect ratio: ${aspectRatio}
- Background: ${keepAvatarBackground ? "Keep the original background from the avatar image" : backgroundDescription}

This image will be used for UGC ad creation, so make it look authentic and engaging.`;
    }

    return `Generate a high-quality, realistic UGC-style photo for a ${platform} ad.

PERSON: ${avatarDescription}
ACTION: ${productHoldingDescription}
PRODUCT: "${productName}"

REQUIREMENTS:
- The person is looking directly at the camera with a natural, friendly smile
- The product "${productName}" must be clearly visible and readable on the packaging
- Photo should look realistic and natural, like a smartphone selfie
- The image should feel authentic and spontaneous, not staged
- Aspect ratio: ${aspectRatio}
- Background: ${backgroundDescription}
- Natural lighting, no harsh studio lights

This image will be used for UGC ad creation, so make it look authentic and engaging.`;
}


export function isConfigured(): boolean {
    return !!process.env.REPLICATE_API_KEY;
}

export async function generateImage(request: NanoBananaRequest): Promise<NanoBananaResult> {
    if (!process.env.REPLICATE_API_KEY) {
        return { success: false, error: "REPLICATE_API_KEY is not configured" };
    }

    const { prompt, avatarImageUrl, productImageUrl, aspectRatio } = request;

    console.log("[NanoBanana] Starting image generation with nano-banana...");
    console.log("[NanoBanana] Prompt:", prompt);
    if (avatarImageUrl) console.log("[NanoBanana] Avatar image:", avatarImageUrl);
    if (productImageUrl) console.log("[NanoBanana] Product image:", productImageUrl);
    if (aspectRatio) console.log("[NanoBanana] Aspect ratio:", aspectRatio);

    try {
        const input: Record<string, unknown> = {
            prompt,
            output_format: "jpg",
        };

        // Build image_input array (Avatar first, then Product)
        const imageInputArray: string[] = [];
        if (avatarImageUrl) imageInputArray.push(avatarImageUrl);
        if (productImageUrl) imageInputArray.push(productImageUrl);

        // Add image_input only if we have images
        if (imageInputArray.length > 0) {
            input.image_input = imageInputArray;
        }

        // Use user-selected aspect ratio
        input.aspect_ratio = aspectRatio || "9:16";

        console.log("[NanoBanana] Calling Replicate nano-banana...");
        console.log("[NanoBanana] Input summary:", {
            prompt_start: prompt.substring(0, 50),
            image_input_count: imageInputArray.length,
            aspect_ratio: input.aspect_ratio
        });

        const output: unknown = await replicate.run(
            "google/nano-banana",
            { input }
        );

        if (!output) {
            throw new Error("No output from Replicate API");
        }

        // Handle ReadableStream output
        if (output instanceof ReadableStream) {
            const reader = output.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            // Concatenate all chunks into a single buffer
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            // Convert to base64 data URL
            const base64 = Buffer.from(combined).toString("base64");
            const imageUrl = `data:image/png;base64,${base64}`;

            console.log("[NanoBanana] ✅ Image generated (stream)");
            return { success: true, imageUrl, status: "completed" };
        }

        // Handle URL string output
        if (typeof output === "string" && output.startsWith("http")) {
            console.log("[NanoBanana] ✅ Image generated:", output);
            return { success: true, imageUrl: output, status: "completed" };
        }

        // Handle array output (some models return array of URLs)
        if (Array.isArray(output) && output.length > 0) {
            const imageUrl = output[0];
            if (typeof imageUrl === "string") {
                console.log("[NanoBanana] ✅ Image generated:", imageUrl);
                return { success: true, imageUrl, status: "completed" };
            }
        }

        throw new Error(`Unexpected output format: ${typeof output}`);
    } catch (error: unknown) {
        console.error("[NanoBanana] ❌ Generation failed:", error);
        const message = error instanceof Error ? error.message : "Image generation failed";
        return { success: false, error: message };
    }
}

/**
 * Check the status of an async generation task
 * (nano-banana usually completes synchronously, but keeping for compatibility)
 */
export async function checkTaskStatus(_taskId: string): Promise<NanoBananaTaskStatus> {
    // nano-banana runs synchronously, so this is mainly for compatibility
    return { status: "completed" };
}

/**
 * Poll until task completes or times out
 * (nano-banana usually completes synchronously)
 */
export async function pollUntilComplete(
    _taskId: string,
    _timeoutMs: number = 120000
): Promise<NanoBananaTaskStatus> {
    // nano-banana runs synchronously, so just return completed
    return { status: "completed" };
}
