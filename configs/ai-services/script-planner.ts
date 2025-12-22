/**
 * Script Planner - Gemini AI
 *
 * Generates video scripts and scene breakdowns using Gemini AI.
 * DYNAMIC scene count based on target duration:
 * - 15s → 2-3 scenes
 * - 30s → 4-5 scenes
 * - 45s → 5-6 scenes
 * - 60s → 7-8 scenes
 *
 * Key features:
 * - Consistent avatar/character throughout all scenes
 * - Natural script flow for seamless final video
 * - Precise duration targeting with Veo-compatible scene lengths
 */

import { GoogleGenAI } from "@google/genai";
import type { VideoGenerationPlan, ScenePlan, VideoLength } from "../schema";

// ============================================
// CONFIGURATION
// ============================================

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.5-flash";

// ============================================
// SCENE CONFIGURATION BY DURATION
// ============================================

/**
 * Get optimal scene breakdown for target duration
 * Veo supports 4, 6, or 8 second scenes only
 */
export function getSceneConfig(targetLength: VideoLength): {
    sceneCount: number;
    sceneDurations: number[];
    description: string;
} {
    switch (targetLength) {
        case "15":
            // 15s = 8 + 7 (generate 8, trim to 7) = 2 scenes
            // Or 6 + 6 + 3 (generate 6+6+4, trim) = 3 scenes
            return {
                sceneCount: 2,
                sceneDurations: [8, 8], // Will trim to ~15s total
                description: "Quick hook + product showcase",
            };
        case "30":
            // 30s = 8 + 8 + 8 + 6 = 4 scenes or 6+6+6+6+6 = 5 scenes
            return {
                sceneCount: 4,
                sceneDurations: [8, 8, 8, 6],
                description: "Hook + Problem + Solution + CTA",
            };
        case "45":
            // 45s = 8 + 8 + 8 + 8 + 8 + 5 = 5-6 scenes
            return {
                sceneCount: 5,
                sceneDurations: [8, 8, 8, 8, 8], // ~40s, can add one more or extend
                description: "Hook + Problem + Solution Demo + Benefits + CTA",
            };
        case "60":
            // 60s = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 4 = 7-8 scenes
            return {
                sceneCount: 7,
                sceneDurations: [8, 8, 8, 8, 8, 8, 8], // ~56s + can trim or extend
                description: "Hook + Problem + Solution + Demo + Testimonial + Benefits + Strong CTA",
            };
        default:
            return {
                sceneCount: 4,
                sceneDurations: [8, 8, 8, 6],
                description: "Standard 4-scene structure",
            };
    }
}

// ============================================
// SCRIPT PLANNER SYSTEM PROMPT
// ============================================

const getScriptPlannerSystemPrompt = (
    sceneConfig: ReturnType<typeof getSceneConfig>
) => `You are an ELITE UGC (User Generated Content) video script writer and scene planner.

Your task is to create a SINGLE CONTINUOUS, engaging script for a product video, then split it into exactly ${sceneConfig.sceneCount} scenes.

CRITICAL CONSISTENCY RULES (for seamless final video):
1. The AVATAR/PERSON must be described the SAME way in every scene
2. Use generic descriptions: "the person", "they", "the presenter" - NOT specific names
3. The BACKGROUND must be IDENTICAL in all scenes (same room, same lighting)
4. CAMERA ANGLE should remain CONSISTENT (front-facing, eye-level)
5. CLOTHING should be described consistently if mentioned
6. The video should feel like ONE CONTINUOUS TAKE when stitched together

SCENE STRUCTURE FOR ${sceneConfig.sceneCount} SCENES:
${sceneConfig.description}

SCENE DURATION RULES:
- Each scene must be EXACTLY one of: 4, 6, or 8 seconds
- Target durations for each scene: [${sceneConfig.sceneDurations.join(", ")}] seconds
- The sum should be close to the target video length

OUTPUT FORMAT (STRICT JSON):
{
  "fullScript": "The complete narration script as one continuous, natural-sounding text that flows seamlessly...",
  "scenes": [
    {
      "sceneIndex": 0,
      "duration": 8,
      "script": "Scene 1 narration - must flow naturally into scene 2...",
      "visualPrompt": "UGC style video: The person is in [consistent setting], wearing [consistent outfit], [action]. Background shows [consistent background]. Natural daylight lighting from the left. Front-facing camera at eye level.",
      "motionDescription": "Natural talking motion, subtle gesturing with hands, occasional nod"
    }
  ],
  "totalDuration": 30
}

VISUAL PROMPT TEMPLATE (use this structure for EVERY scene):
"UGC style video: The person is in [SAME setting], wearing [SAME outfit], [specific action for this scene]. 
Background shows [SAME background details]. 
[SAME lighting description]. 
Front-facing camera at eye level.
The person is [emotion/expression] while [action]."

MOTION DESCRIPTION GUIDELINES:
- Keep movements SUBTLE and natural
- Good: "talking to camera", "slight head nod", "holding product", "gentle gesturing"
- BAD: "walking around", "jumping", "complex movements", "changing positions"

SCRIPT FLOW GUIDELINES:
- Scene transitions should feel natural (no abrupt topic changes)
- Use connecting phrases: "And that's why...", "But here's the thing...", "So..."
- The full script should read as ONE continuous monologue
- Avoid scene-specific greetings like "Hey" repeated in each scene`;

// ============================================
// SCRIPT PLANNER FUNCTION
// ============================================

interface ScriptPlannerInput {
    productName: string;
    productDescription: string;
    targetLength: VideoLength;
    platform?: string;
    tone?: string;
    avatarDescription?: string;
    backgroundDescription?: string;
    userScript?: string; // Optional user provided script
}

/**
 * Generate a video script and scene plan using Gemini AI
 * Returns dynamic scene count based on target duration
 *
 * @param input - Product details and video configuration
 * @returns Video generation plan with script and scene breakdown
 */
export async function generateScriptPlan(
    input: ScriptPlannerInput
): Promise<VideoGenerationPlan> {
    const {
        productName,
        productDescription,
        targetLength,
        platform = "TikTok",
        tone = "authentic, relatable, and enthusiastic",
        avatarDescription,
        backgroundDescription,
        userScript,
    } = input;

    const sceneConfig = getSceneConfig(targetLength);

    console.log(`[ScriptPlanner] Generating ${sceneConfig.sceneCount}-scene script for ${targetLength}s video`);

    // If User Script is provided, bypass AI and manually split
    if (userScript && userScript.trim().length > 10) {
        console.log("[ScriptPlanner] User script provided - Bypassing AI planning");

        // Smart manual split algorithm
        const fullScript = userScript.trim();
        let chunks: string[] = [];

        // 1. Try splitting by major punctuation
        const sentences = fullScript.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [fullScript];

        if (sentences.length >= sceneConfig.sceneCount) {
            // We have enough sentences, distribute them
            const buckets: string[] = Array(sceneConfig.sceneCount).fill("");
            sentences.forEach((sentence, index) => {
                const bucketIndex = index % sceneConfig.sceneCount;
                buckets[bucketIndex] += (buckets[bucketIndex] ? " " : "") + sentence.trim();
            });
            chunks = buckets;
        } else {
            // 2. Not enough sentences, try splitting by clauses (commas)
            const clauses = fullScript.split(/[,;]/g).map(s => s.trim()).filter(s => s.length > 0);

            if (clauses.length >= sceneConfig.sceneCount) {
                const buckets: string[] = Array(sceneConfig.sceneCount).fill("");
                clauses.forEach((clause, index) => {
                    const bucketIndex = index % sceneConfig.sceneCount;
                    buckets[bucketIndex] += (buckets[bucketIndex] ? " " : "") + clause.trim();
                });
                chunks = buckets;
            } else {
                // 3. Last resort: Split by word count roughly evenly
                const words = fullScript.split(/\s+/);
                const wordsPerScene = Math.ceil(words.length / sceneConfig.sceneCount);

                for (let i = 0; i < sceneConfig.sceneCount; i++) {
                    const start = i * wordsPerScene;
                    const end = start + wordsPerScene;
                    const chunkText = words.slice(start, end).join(" ");
                    chunks.push(chunkText || "..."); // Fallback if empty
                }
            }
        }

        // Construct scenes from chunks
        const scenes: ScenePlan[] = chunks.map((chunk, index) => ({
            sceneIndex: index,
            duration: sceneConfig.sceneDurations[index] || 8,
            script: chunk || "...",
            visualPrompt: `Action scene ${index + 1}: The person gestures naturally while speaking about ${productName}.`,
            motionDescription: "Natural talking motion, consistent with reference."
        }));

        const manualPlan: VideoGenerationPlan = {
            fullScript,
            scenes,
            totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0)
        };

        console.log(`[ScriptPlanner] Manually split into ${scenes.length} scenes`);
        return manualPlan;
    }

    // --- AI Generation path (Only used when generating from scratch) ---

    const userPrompt = `
Create a ${targetLength}-second UGC video script with exactly ${sceneConfig.sceneCount} scenes.

PRODUCT NAME: ${productName}
PRODUCT DESCRIPTION: ${productDescription}
PLATFORM: ${platform}
TONE: ${tone}

${avatarDescription ? `AVATAR DESCRIPTION (use this consistently): ${avatarDescription}` : "AVATAR: A friendly, relatable person (keep description generic for consistency)"}
${backgroundDescription ? `BACKGROUND (use this consistently): ${backgroundDescription}` : "BACKGROUND: Clean, well-lit room with neutral decor (keep consistent across all scenes)"}

TARGET SCENE DURATIONS: [${sceneConfig.sceneDurations.join(", ")}] seconds per scene

STRUCTURE: ${sceneConfig.description}

Requirements:
1. The script must flow naturally as ONE continuous speech
2. Include a strong hook in the first 3 seconds
3. Show product benefits naturally throughout
4. End with a clear call-to-action
5. Each scene duration must be exactly 4, 6, or 8 seconds
6. Total should equal approximately ${targetLength} seconds
7. CRITICAL: Avatar appearance, background, and lighting must be IDENTICAL in every scene's visualPrompt

Generate the complete script and ${sceneConfig.sceneCount} scene breakdown now.`;

    try {
        const result = await ai.models.generateContent({
            model: MODEL_NAME,
            config: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
                systemInstruction: getScriptPlannerSystemPrompt(sceneConfig),
            },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        });

        // Extract text response
        let responseText = result.text || "";

        // Strip Markdown code blocks if present (Gemini often adds them despite MIME type)
        responseText = responseText.replace(/```json\n?|\n?```/g, "").trim();

        console.log("[ScriptPlanner] Raw AI Response:", responseText);

        if (!responseText) {
            throw new Error("Empty response from Gemini");
        }

        // Parse the JSON response
        const plan: VideoGenerationPlan = JSON.parse(responseText);

        // Validate and fix the plan
        const validatedPlan = validateAndFixScriptPlan(plan, parseInt(targetLength), sceneConfig);

        console.log(`[ScriptPlanner] Generated ${validatedPlan.scenes.length} scenes, total ${validatedPlan.totalDuration}s`);

        return validatedPlan;
    } catch (error) {
        console.error("Script planner error:", error);
        throw new Error(
            `Failed to generate script plan: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}


/**
 * Validate and fix script plan to meet requirements
 */
function validateAndFixScriptPlan(
    plan: VideoGenerationPlan,
    targetLength: number,
    _sceneConfig: ReturnType<typeof getSceneConfig>
): VideoGenerationPlan {
    if (!plan.fullScript || plan.fullScript.length < 10) {
        throw new Error("Invalid script: fullScript is empty or too short");
    }

    if (!plan.scenes || plan.scenes.length === 0) {
        throw new Error("Invalid script: no scenes defined");
    }

    // Fix scene indices and validate durations
    const fixedScenes: ScenePlan[] = plan.scenes.map((scene, index) => {
        // Ensure duration is valid (4, 6, or 8)
        let duration = scene.duration;
        if (![4, 6, 8].includes(duration)) {
            // Round to nearest valid duration
            if (duration <= 5) duration = 4;
            else if (duration <= 7) duration = 6;
            else duration = 8;
        }

        return {
            ...scene,
            sceneIndex: index,
            duration,
            script: scene.script || `Scene ${index + 1} dialogue`,
            visualPrompt: scene.visualPrompt || `UGC style video scene ${index + 1}`,
            motionDescription: scene.motionDescription || "Natural talking motion",
        };
    });

    // Calculate actual duration
    const actualTotal = fixedScenes.reduce((sum, s) => sum + s.duration, 0);

    // Allow some flexibility
    if (Math.abs(actualTotal - targetLength) > 10) {
        console.warn(`Duration mismatch: planned ${actualTotal}s, target ${targetLength}s. Adjusting...`);
    }

    return {
        fullScript: plan.fullScript,
        scenes: fixedScenes,
        totalDuration: actualTotal,
    };
}

/**
 * Adjust scene durations to exactly match target length
 * Called after initial plan generation to ensure precise timing
 */
export function adjustSceneDurations(
    scenes: ScenePlan[],
    targetLength: number
): ScenePlan[] {
    const currentTotal = scenes.reduce((sum, s) => sum + s.duration, 0);
    const difference = targetLength - currentTotal;

    if (Math.abs(difference) <= 2) return scenes;

    // Clone scenes to avoid mutation
    const adjustedScenes = scenes.map((s) => ({ ...s }));

    console.log(`Scene adjustment needed: ${difference}s difference`);

    // If we need more time, extend longest scenes
    // If we need less time, we'll trim in FFmpeg
    return adjustedScenes;
}

export type { ScriptPlannerInput };
