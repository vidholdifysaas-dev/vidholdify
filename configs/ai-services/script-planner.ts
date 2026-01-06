import { GoogleGenAI } from "@google/genai";
import type { VideoGenerationPlan, ScenePlan, VideoLength } from "../schema";

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.5-flash";


export function getSceneConfig(targetLength: VideoLength): {
    sceneCount: number;
    sceneDurations: number[];
    description: string;
} {
    switch (targetLength) {
        case "15":
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
            // 45s = 6 scenes (8+8+8+8+6+6 = 44s)
            return {
                sceneCount: 6,
                sceneDurations: [8, 8, 8, 8, 6, 6],
                description: "Hook + Problem + Solution + Analysis + Benefits + CTA",
            };
        case "60":
            // 60s = 8 scenes ~60s
            return {
                sceneCount: 8,
                sceneDurations: [8, 8, 8, 8, 8, 8, 6, 6],
                description: "Hook + Problem + Story/Experience + Solution + Demo + Features + Benefits + CTA",
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

OUTPUT FORMAT (STRICT JSON, NO MARKDOWN, NO CODE BLOCKS):
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
- Good: "talking to camera", "slight head nod", "holding product", "gentle gesturing", "pointing"
- BAD (FORBIDDEN): "eating", "drinking", "chewing", "walking around", "jumping", "complex movements", "changing positions", "applying product to face"
- NEVER depict the avatar consuming food or drink.
- NEVER depict the avatar putting things in their mouth.

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
    targetLength: VideoLength;
    platform?: string;
    tone?: string;
    avatarDescription?: string;
    backgroundDescription?: string;
    userScript?: string;
}

/**
 * Generate a video script and scene plan using Gemini AI
 * Returns dynamic scene count based on target duration
 * Retries up to 3 times on JSON parse error
 */
export async function generateScriptPlan(
    input: ScriptPlannerInput
): Promise<VideoGenerationPlan> {
    const {
        productName,
        targetLength,
        platform = "TikTok",
        tone = "authentic, relatable, and enthusiastic",
        avatarDescription,
        backgroundDescription,
        userScript,
    } = input;

    const sceneConfig = getSceneConfig(targetLength);
    const maxRetries = 5;
    let lastError: Error | null = null;
    console.log(`[ScriptPlanner] Generating ${sceneConfig.sceneCount}-scene script for ${targetLength}s video`);

    let userPrompt = "";

    if (userScript && userScript.trim().length > 10) {
        // Mode 1: Use User Script
        console.log("[ScriptPlanner] Using user-provided script");
        userPrompt = `
You are given a pre-written script. Your task is to split this EXACT script into ${sceneConfig.sceneCount} scenes.

USER SCRIPT:
"${userScript}"

PRODUCT NAME: ${productName}

${avatarDescription ? `AVATAR DESCRIPTION (use this consistently): ${avatarDescription}` : "AVATAR: A friendly, relatable person (keep description generic for consistency)"}
${backgroundDescription ? `BACKGROUND (use this consistently): ${backgroundDescription}` : "BACKGROUND: Clean, well-lit room with neutral decor (keep consistent across all scenes)"}

TARGET SCENE DURATIONS: [${sceneConfig.sceneDurations.join(", ")}] seconds per scene

Requirements:
1. Use the EXACT text from the USER SCRIPT.
2. Split the script logicallly across ${sceneConfig.sceneCount} scenes.
3. CRITICAL: NEVER split a sentence between scenes. Breaks must be at periods, commas, or natural pauses.
4. Ensure the visual prompts match the script content for each scene.
5. Each scene duration must be exactly 4, 6, or 8 seconds.
5. Total should equal approximately ${targetLength} seconds.
6. CRITICAL: Avatar appearance, background, and lighting must be IDENTICAL in every scene's visualPrompt.

Generate the breakdown now.`;

    } else {
        // Mode 2: Generate New Script (Original Logic)
        userPrompt = `
Create a ${targetLength}-second UGC video script with exactly ${sceneConfig.sceneCount} scenes.

PRODUCT NAME: ${productName}
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
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[ScriptPlanner] Attempt ${attempt}/${maxRetries}`);

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

            if (!responseText) {
                if (attempt === maxRetries) throw new Error("Empty response from Gemini");
                console.warn("[ScriptPlanner] Empty response, retrying...");
                continue;
            }

            // Clean up the JSON response
            responseText = responseText
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\r/g, '')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/) || responseText.match(/```\s*([\s\S]*?)```/);
            if (jsonMatch) {
                responseText = jsonMatch[1].trim();
            }

            console.log(`[ScriptPlanner] Parsing response (${responseText.length} chars)`);

            // Parse the JSON response
            let plan: VideoGenerationPlan;
            try {
                plan = JSON.parse(responseText);
            } catch (parseError) {
                console.error("[ScriptPlanner] JSON parse error. Raw response:", responseText.substring(0, 500));
                if (attempt === maxRetries) throw new Error(`Invalid JSON from Gemini: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);

                // If parse fails, we retry loop
                console.warn(`[ScriptPlanner] JSON parse failed on attempt ${attempt}, retrying...`);
                continue;
            }

            // Validate and fix the plan
            const validatedPlan = validateAndFixScriptPlan(plan, parseInt(targetLength), sceneConfig);

            console.log(`[ScriptPlanner] Generated ${validatedPlan.scenes.length} scenes, total ${validatedPlan.totalDuration}s`);

            return validatedPlan;

        } catch (error) {
            console.error(`[ScriptPlanner] Error on attempt ${attempt}:`, error);
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === maxRetries) {
                console.warn("[ScriptPlanner] All AI attempts failed. Executing PANIC FALLBACK.");
                try {
                    const fallbackPlan = createFallbackPlan(input, sceneConfig);
                    return validateAndFixScriptPlan(fallbackPlan, parseInt(targetLength), sceneConfig);
                } catch (fallbackError) {
                    // If even fallback fails, then throw original error
                    console.error("[ScriptPlanner] Fallback also failed:", fallbackError);
                    break;
                }
            }

            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    throw new Error(
        `Failed to generate script plan after ${maxRetries} attempts: ${lastError?.message || "Unknown error"}`
    );
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



    // Adjust durations to match exact target
    const adjustedScenes = adjustSceneDurations(fixedScenes, targetLength);

    // Calculate actual duration
    const actualTotal = adjustedScenes.reduce((sum, s) => sum + s.duration, 0);

    // Allow some flexibility
    if (Math.abs(actualTotal - targetLength) > 5) {
        console.warn(`[ScriptPlanner] Duration mismatch warning: planned ${actualTotal}s, target ${targetLength}s.`);
    }

    return {
        fullScript: plan.fullScript,
        scenes: adjustedScenes,
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

    console.log(`[ScriptPlanner] Adjusting scenes to match target ${targetLength}s (Current: ${currentTotal}s)`);

    // Helper to find index of a scene that matches condition
    const findSceneIndex = (durations: number[], predicate: (d: number) => boolean) => {
        // Try to distribute changes from the middle/later scenes first to keep hooks (first scene) intact if possible
        // But for simplicity, we search from end to start
        for (let i = durations.length - 1; i >= 0; i--) {
            if (predicate(durations[i])) return i;
        }
        return -1;
    };

    let attempt = 0;
    while (attempt < 10) {
        const currentSum = adjustedScenes.reduce((sum, s) => sum + s.duration, 0);
        const diff = targetLength - currentSum;

        if (Math.abs(diff) <= 1) break; // Close enough

        if (diff > 0) {
            // Need MORE time: Promote 4->6 or 6->8
            // Prefer promoting 6->8 first (longer scenes are okay), then 4->6
            let idx = findSceneIndex(adjustedScenes.map(s => s.duration), d => d === 6);
            if (idx === -1) idx = findSceneIndex(adjustedScenes.map(s => s.duration), d => d === 4);

            if (idx !== -1) {
                adjustedScenes[idx].duration += 2;
                console.log(`[ScriptPlanner] Extended scene ${idx + 1} to ${adjustedScenes[idx].duration}s`);
            } else {
                // No scenes can be extended (all are 8s)
                // Nothing more we can do without adding scenes
                console.warn("[ScriptPlanner] Cannot extend scenes further (all maxed at 8s)");
                break;
            }
        } else {
            // Need LESS time: Demote 8->6 or 6->4
            // Prefer demoting 8->6 first, then 6->4
            let idx = findSceneIndex(adjustedScenes.map(s => s.duration), d => d === 8);
            if (idx === -1) idx = findSceneIndex(adjustedScenes.map(s => s.duration), d => d === 6);

            if (idx !== -1) {
                adjustedScenes[idx].duration -= 2;
                console.log(`[ScriptPlanner] Shortened scene ${idx + 1} to ${adjustedScenes[idx].duration}s`);
            } else {
                // No scenes can be shortened (all are 4s)
                console.warn("[ScriptPlanner] Cannot shorten scenes further (all min at 4s)");
                break;
            }
        }
        attempt++;
    }

    return adjustedScenes;
}

/**
 * Fallback generator when AI fails
 * Manually splits script into roughly equal parts
 */
function createFallbackPlan(
    input: ScriptPlannerInput,
    sceneConfig: ReturnType<typeof getSceneConfig>
): VideoGenerationPlan {
    const { userScript, productName, avatarDescription, backgroundDescription } = input;

    // Use user script or generate a generic one
    const script = userScript?.trim() ||
        `I just discovered ${productName} and it's amazing. You have to try it. It completely changed my routine. The results are incredible. I highly recommend it to everyone.`;

    // Split into N chunks
    // Simple logic: split by sentences, then group into N chunks
    const sentences = script.split(/(?<=[.!?])\s+/);
    const scenes: ScenePlan[] = [];
    const count = sceneConfig.sceneCount;

    // If not enough sentences, split by words
    const chunks: string[] = [];
    if (sentences.length < count) {
        const words = script.split(' ');
        const chunkSize = Math.ceil(words.length / count);
        for (let i = 0; i < count; i++) {
            chunks.push(words.slice(i * chunkSize, (i + 1) * chunkSize).join(' '));
        }
    } else {
        // Distribute sentences
        const sentPerScene = Math.ceil(sentences.length / count);
        for (let i = 0; i < count; i++) {
            chunks.push(sentences.slice(i * sentPerScene, (i + 1) * sentPerScene).join(' '));
        }
    }

    // Assign to scenes
    for (let i = 0; i < count; i++) {
        // Fill empty chunks if any
        const text = chunks[i] || `Scene ${i + 1} narration about ${productName}`;

        scenes.push({
            sceneIndex: i,
            duration: sceneConfig.sceneDurations[i] || 4,
            script: text,
            visualPrompt: `UGC style video: ${avatarDescription || "Person"} in ${backgroundDescription || "room"}, talking about ${productName}. Scene ${i + 1}.`,
            motionDescription: "Natural talking motion",
        });
    }

    return {
        fullScript: script,
        scenes,
        totalDuration: scenes.reduce((s, x) => s + x.duration, 0)
    };
}

export type { ScriptPlannerInput };
