/**
 * AI Services Index
 * 
 * Central export point for all AI-related services used in the video pipeline.
 * 
 * New Architecture:
 * - replicate-veo: Video generation using Replicate's Veo-3-fast
 * - lambda-merger: AWS Lambda for FFmpeg video merging
 * - script-planner: Gemini for script generation
 * - nano-banana: Reference image generation
 */

// Script and scene planning (Gemini)
export {
    generateScriptPlan,
    adjustSceneDurations,
    getSceneConfig,
    type ScriptPlannerInput,
} from "./script-planner";

// Video generation with Replicate Veo-3-fast (NEW)
export {
    generateVeoScene,
    generateAllScenes,
    isReplicateConfigured,
    type VeoSceneRequest,
    type VeoSceneResult,
    type GenerateAllScenesResult,
} from "./replicate-veo";

// Lambda FFmpeg Merger (NEW)
export {
    invokeMergerLambda,
    invokeMergerLambdaAsync,
    isLambdaMergerConfigured,
    getSceneS3Key,
    getFinalVideoS3Key,
    type MergeRequest,
    type MergeResult,
} from "./lambda-merger";

// Nano Banana image generation
export {
    generateImage,
    checkTaskStatus,
    pollUntilComplete,
    buildImagePrompt,
    isConfigured as isNanoBananaConfigured,
    type NanoBananaRequest,
    type NanoBananaResult,
    type NanoBananaTaskStatus,
} from "./nano-banana";
