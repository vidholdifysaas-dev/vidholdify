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
        productHoldingDescription = "holding the product naturally in their hand, presenting it to the camera",
        backgroundDescription = "a clean, real home environment with natural daytime lighting",
        platform = "TikTok",
        hasAvatarImage = false,
        hasProductImage = false,
        keepAvatarBackground = true,
        aspectRatio = "9:16",
    } = params;

    // Common negative prompt for all scenarios - stronger for hand quality
    const negativePrompt = "(poorly drawn hands:2.0), (missing fingers:2.0), (extra fingers:2.0), (malformed hands:2.0), (deformed hands:1.8), (fused fingers:1.8), (too many fingers:1.8), (bad anatomy:1.5), (floating product:1.8), (disconnected hands:2.0), (product not in hand:1.8), (blurry hands:1.5), (cropped hands:1.5)";

    if (hasAvatarImage && hasProductImage) {
        return `Create a professional UGC-style product showcase photo combining the avatar and product from the input images.

CRITICAL REQUIREMENTS:
- PRESERVE the avatar's exact face, expression, hair, clothing, and body from the reference image
- PRESERVE the exact product appearance from the product reference — same shape, label, logo, colors, and branding
- The avatar must be HOLDING the product in their hand with a natural, secure grip

HAND AND PRODUCT PLACEMENT (VERY IMPORTANT):
- Show both hands clearly with anatomically correct fingers (5 fingers per hand, proper joints)
- One hand should be gripping the product firmly with fingers wrapped around it naturally
- Product should be positioned at chest/shoulder level, tilted slightly toward camera for visibility
- Hand must be connected to the arm naturally, no floating or disconnected hands
- Fingers should show natural wrapping motion around the product with visible knuckles

POSE AND EXPRESSION:
- Person facing camera with friendly, genuine smile
- Eyes looking directly at camera
- Natural, relaxed body posture like taking a casual selfie
- Product prominently displayed but not blocking face

QUALITY:
- Professional smartphone photo quality
- Natural indoor/outdoor lighting
- Sharp focus on both face and product
- Aspect ratio: ${aspectRatio}

Negative prompt: ${negativePrompt}`;
    }

    if (hasAvatarImage && !hasProductImage) {
        return `Create a professional UGC-style product showcase photo using the avatar from the reference image.

CRITICAL REQUIREMENTS:
- PRESERVE the avatar's exact appearance: same face, hairstyle, skin tone, clothing, and style
- Generate the person ${productHoldingDescription}
- Create a realistic "${productName}" product that the person is actively holding

HAND AND PRODUCT PLACEMENT (MOST IMPORTANT):
- Generate anatomically perfect hands with exactly 5 fingers each, proper proportions and joints
- The hand holding the product must show:
  * Clear thumb on one side, four fingers wrapping on the other side
  * Natural finger bend and grip pressure
  * Product securely held (not floating or loosely touching)
  * Visible palm or back of hand depending on angle
- Position the product at chest to shoulder height, angled toward camera
- The arm must be naturally connected to the body and hand
- Show the full hand with wrist visible for natural anatomy

PRODUCT DETAILS:
- Product "${productName}" should look realistic with clear packaging/branding
- Product size should be appropriate for hand size
- Product should be the main focus alongside the person's face

POSE AND COMPOSITION:
- Person looking at camera with authentic, engaging expression
- Natural body posture, relaxed shoulders
- Product prominently displayed in the frame
- Aspect ratio: ${aspectRatio}
- Background: ${keepAvatarBackground ? "Keep the original background from the avatar image" : backgroundDescription}

STYLE:
- High-quality smartphone selfie aesthetic
- Natural, soft lighting
- Sharp, professional focus
- Authentic UGC content creator vibe

Negative prompt: ${negativePrompt}`;
    }

    return `Create a professional UGC-style product showcase photo for a ${platform} advertisement.

PERSON DESCRIPTION:
${avatarDescription}

ACTION:
${productHoldingDescription}, actively presenting the product to the camera

PRODUCT:
"${productName}" - clearly visible with readable branding/label

HAND AND PRODUCT PLACEMENT (CRITICAL):
- Show anatomically correct hands with exactly 5 fingers each
- Natural finger positioning with proper joints and proportions
- Hand must be gripping the product firmly but naturally:
  * Thumb on one side, fingers wrapped on the other
  * Visible knuckles and natural finger bend
  * Product resting securely in palm or grip
- Product positioned at chest/shoulder level, angled toward camera
- Full arm visible from shoulder to hand for natural anatomy
- No floating products, hands must be physically holding the item

COMPOSITION:
- Person centered in frame, facing camera directly
- Friendly, genuine smile with eyes on camera
- Natural, relaxed posture (not stiff or staged)
- Product prominently displayed without blocking face
- Aspect ratio: ${aspectRatio}
- Background: ${backgroundDescription}

QUALITY AND LIGHTING:
- High-resolution smartphone selfie quality
- Natural lighting (daylight or soft indoor lights)
- Sharp focus on face and product
- Authentic, spontaneous UGC aesthetic

This image is for paid advertising - must look professional yet relatable.

Negative prompt: ${negativePrompt}`;
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
