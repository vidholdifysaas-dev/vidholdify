/**
 * Replicate Veo-3-Fast Video Generation Service
 *
 * Uses Replicate's veo-3-fast model for video generation.
 * This runs in Next.js API routes (serverless).
 *
 * Key features:
 * - SAME reference image used for ALL scenes (avatar consistency)
 * - Consistent background, lighting, and camera angle
 * - Sequential scene generation with progress callbacks
 * - Dynamic scene count based on target duration
 */

import axios from "axios";

export interface VeoSceneRequest {
    referenceImageUrl: string; // SAME image for ALL scenes
    script: string; // Dialogue that Veo will speak
    visualPrompt: string;
    motionDescription: string;
    productName: string;
    sceneIndex: number;
    totalScenes: number;
    duration: number; // 4, 6, or 8 seconds
    avatarDescription?: string; // Optional for consistency
    backgroundDescription?: string; // Optional for consistency
    aspectRatio?: "16:9" | "9:16"; // Video aspect ratio (Veo supports both)
    resolution?: "720p"; // Video resolution
}

export interface VeoSceneResult {
    success: boolean;
    videoUrl?: string;
    predictionId?: string;
    error?: string;
}

export interface GenerateAllScenesResult {
    success: boolean;
    scenes: Array<{
        sceneIndex: number;
        videoUrl: string;
        duration: number;
    }>;
    totalDuration?: number;
    error?: string;
}

// Replicate API base URL
const REPLICATE_API_URL = "https://api.replicate.com/v1";

/**
 * Check if Replicate is configured
 */
export function isReplicateConfigured(): boolean {
    return !!process.env.REPLICATE_API_KEY;
}

/**
 * Generate a single scene video using Replicate Veo-3-fast
 * 
 * CRITICAL: Uses the SAME reference image for avatar consistency
 */
export async function generateVeoScene(
    request: VeoSceneRequest
): Promise<VeoSceneResult> {
    const {
        referenceImageUrl,
        script,
        visualPrompt,
        motionDescription,
        productName,
        sceneIndex,
        totalScenes,
        duration,
        avatarDescription,
        backgroundDescription,
        aspectRatio = "16:9",
        resolution = "720p",
    } = request;

    const apiToken = process.env.REPLICATE_API_KEY;
    if (!apiToken) {
        return { success: false, error: "REPLICATE_API_KEY not configured" };
    }

    console.log(
        `[Veo] Generating scene ${sceneIndex + 1}/${totalScenes} (${duration}s)`
    );
    console.log(`[Veo] Script: "${script.substring(0, 80)}..."`);

    try {
        // Build the prompt with STRONG CONSISTENCY emphasis
        const prompt = buildConsistentPrompt({
            script,
            visualPrompt,
            motionDescription,
            productName,
            sceneIndex,
            totalScenes,
            avatarDescription,
            backgroundDescription,
        });

        // Create Replicate prediction using the models endpoint
        // Official model: google/veo-3.1-fast
        const modelOwner = "google";
        const modelName = process.env.REPLICATE_VEO_MODEL || "veo-3.1-fast";

        console.log(`[Veo] Using model: ${modelOwner}/${modelName}`);
        console.log(`[Veo] Reference image: ${referenceImageUrl?.substring(0, 80)}...`);

        const { data: prediction } = await axios.post<{
            id: string;
            status: string;
            output?: string | string[];
            error?: string;
            urls?: { get: string };
        }>(
            `${REPLICATE_API_URL}/models/${modelOwner}/${modelName}/predictions`,
            {
                input: {
                    prompt,
                    image: referenceImageUrl,
                    duration,
                    resolution,
                    aspect_ratio: aspectRatio,
                    generate_audio: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log(
            `[Veo] Prediction created: ${prediction.id}, status: ${prediction.status}`
        );

        // Poll for completion
        const result = await pollReplicatePrediction(prediction.id, apiToken);

        if (!result.success || !result.videoUrl) {
            throw new Error(result.error || "Failed to generate video");
        }

        console.log(`[Veo] Scene ${sceneIndex + 1} generated successfully`);
        return {
            success: true,
            videoUrl: result.videoUrl,
            predictionId: prediction.id,
        };
    } catch (error) {
        console.error(`[Veo] Generation failed for scene ${sceneIndex}:`, error);

        // Extract error message from axios error
        let errorMessage = "Veo generation failed";
        if (axios.isAxiosError(error)) {
            errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Build a consistent prompt that maintains avatar/background across scenes
 */
function buildConsistentPrompt(params: {
    script: string;
    visualPrompt: string;
    motionDescription: string;
    productName: string;
    sceneIndex: number;
    totalScenes: number;
    avatarDescription?: string;
    backgroundDescription?: string;
}): string {
    const {
        script,
        visualPrompt,
        motionDescription,
        productName,
        sceneIndex,
        totalScenes,
        avatarDescription,
        backgroundDescription,
    } = params;

    // Determine scene position for natural flow
    const scenePosition = sceneIndex === 0
        ? "OPENING"
        : sceneIndex === totalScenes - 1
            ? "CLOSING"
            : "MIDDLE";

    return `Generate scene ${sceneIndex + 1} of ${totalScenes} for a UGC product video about "${productName}".

CRITICAL: This video will be stitched with other scenes. The person MUST look EXACTLY like the reference image in EVERY frame.

SPOKEN DIALOGUE (natural, conversational):
"${script}"

=== ABSOLUTE REQUIREMENTS FOR CONSISTENCY ===

1. PERSON/AVATAR:
   - MUST be the EXACT same person from the reference image
   - Same face, hair color, hairstyle, skin tone, body type
   - Same clothing and accessories
   ${avatarDescription ? `- Description: ${avatarDescription}` : ""}

2. BACKGROUND:
   - MUST be IDENTICAL to the reference image
   - Same room, same objects, same arrangement
   - NO changes between scenes
   ${backgroundDescription ? `- Description: ${backgroundDescription}` : ""}

3. CAMERA:
   - STATIC camera - NO movement
   - Front-facing, eye-level angle
   - Same framing as reference image

4. LIGHTING:
   - IDENTICAL lighting to reference image
   - No changes in brightness, shadows, or color temperature

5. MOTION:
   - ${motionDescription}
   - Keep movements SUBTLE and natural
   - Natural lip sync matching the dialogue
   - Slight hand gestures only

=== SCENE CONTEXT ===
Position: ${scenePosition} scene
Visual: ${visualPrompt}

=== AUDIO ===
- Clear speech matching the dialogue above
- Natural, authentic delivery
- No background music

This is part of a CONTINUOUS video - it must flow seamlessly with other scenes. DO NOT introduce any visual changes that would break continuity.`;
}

/**
 * Poll Replicate prediction until complete
 */
async function pollReplicatePrediction(
    predictionId: string,
    apiToken: string
): Promise<VeoSceneResult> {
    const maxAttempts = 120; // 10 minutes with 5s intervals
    const pollInterval = 5000;

    console.log(`[Veo] Polling prediction: ${predictionId}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const { data: prediction } = await axios.get<{
                id: string;
                status: string;
                output?: string | string[];
                error?: string;
            }>(
                `${REPLICATE_API_URL}/predictions/${predictionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${apiToken}`,
                    },
                }
            );

            if (prediction.status === "succeeded") {
                // Extract video URL from output
                let videoUrl: string | undefined;

                if (typeof prediction.output === "string") {
                    videoUrl = prediction.output;
                } else if (
                    Array.isArray(prediction.output) &&
                    prediction.output.length > 0
                ) {
                    videoUrl = prediction.output[0];
                }

                if (!videoUrl) {
                    return { success: false, error: "No video URL in output" };
                }

                return { success: true, videoUrl, predictionId };
            }

            if (prediction.status === "failed") {
                return {
                    success: false,
                    error: prediction.error || "Prediction failed",
                    predictionId,
                };
            }

            if (prediction.status === "canceled") {
                return {
                    success: false,
                    error: "Prediction was canceled",
                    predictionId,
                };
            }

            // Still processing
            if (attempt % 6 === 0) {
                // Log every 30 seconds
                console.log(
                    `[Veo] Prediction ${predictionId} status: ${prediction.status} (${Math.round((attempt * pollInterval) / 1000)}s elapsed)`
                );
            }
            await sleep(pollInterval);
        } catch (error) {
            console.error(`[Veo] Poll error:`, error);
            await sleep(pollInterval);
        }
    }

    return {
        success: false,
        error: "Prediction timed out after 10 minutes",
        predictionId,
    };
}

/**
 * Generate all scene videos in sequence
 * Uses the SAME reference image for all scenes (consistency)
 */
export async function generateAllScenes(
    referenceImageUrl: string,
    scenes: Array<{
        sceneIndex: number;
        script: string;
        visualPrompt: string;
        motionDescription: string;
        plannedDuration: number;
    }>,
    productName: string,
    onProgress?: (sceneIndex: number, status: string) => Promise<void> | void,
    options?: {
        avatarDescription?: string;
        backgroundDescription?: string;
        aspectRatio?: "16:9" | "9:16";
        resolution?: "720p";
    }
): Promise<GenerateAllScenesResult> {
    console.log(`[Veo] ========================================`);
    console.log(`[Veo] Starting generation of ${scenes.length} scenes`);
    console.log(`[Veo] Reference image (SAME for all): ${referenceImageUrl}`);
    console.log(`[Veo] ========================================`);

    const results: Array<{
        sceneIndex: number;
        videoUrl: string;
        duration: number;
    }> = [];

    let totalDuration = 0;

    for (const scene of scenes) {
        await onProgress?.(scene.sceneIndex, "generating");

        console.log(`[Veo] --- Scene ${scene.sceneIndex + 1}/${scenes.length} ---`);

        const result = await generateVeoScene({
            referenceImageUrl, // SAME image for ALL scenes
            script: scene.script,
            visualPrompt: scene.visualPrompt,
            motionDescription: scene.motionDescription,
            productName,
            sceneIndex: scene.sceneIndex,
            totalScenes: scenes.length,
            duration: getVeoDuration(scene.plannedDuration),
            avatarDescription: options?.avatarDescription,
            backgroundDescription: options?.backgroundDescription,
            aspectRatio: options?.aspectRatio,
            resolution: options?.resolution,
        });

        if (!result.success || !result.videoUrl) {
            console.error(`[Veo] Scene ${scene.sceneIndex + 1} FAILED: ${result.error}`);
            return {
                success: false,
                scenes: results,
                error: `Scene ${scene.sceneIndex + 1} failed: ${result.error}`,
            };
        }

        results.push({
            sceneIndex: scene.sceneIndex,
            videoUrl: result.videoUrl,
            duration: scene.plannedDuration,
        });

        totalDuration += scene.plannedDuration;

        await onProgress?.(scene.sceneIndex, "completed");
        console.log(`[Veo] Scene ${scene.sceneIndex + 1} ✓`);
    }

    console.log(`[Veo] ========================================`);
    console.log(`[Veo] All ${scenes.length} scenes generated successfully!`);
    console.log(`[Veo] Total planned duration: ${totalDuration}s`);
    console.log(`[Veo] ========================================`);

    return { success: true, scenes: results, totalDuration };
}

/**
 * Get Veo-compatible duration (4, 6, or 8 seconds)
 */
export function getVeoDuration(plannedDuration: number): number {
    if (plannedDuration <= 4) return 4;
    if (plannedDuration <= 6) return 6;
    return 8;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
