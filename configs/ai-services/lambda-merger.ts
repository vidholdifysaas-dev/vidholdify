/**
 * Lambda FFmpeg Merger Service
 *
 * Invokes AWS Lambda function to merge scene videos using FFmpeg.
 * The Lambda function:
 * 1. Downloads scene videos from S3
 * 2. Merges with crossfade transitions
 * 3. Uploads final video to S3
 * 4. Returns the final video URL
 */

import {
    LambdaClient,
    InvokeCommand,
    InvocationType,
} from "@aws-sdk/client-lambda";

// ============================================
// TYPES
// ============================================

export interface MergeRequest {
    jobId: string;
    clips: Array<{
        s3Key: string;
        sceneIndex: number;
        duration: number;
    }>;
    outputKey: string;
    crossfadeDuration?: number;
}

export interface MergeResult {
    success: boolean;
    finalVideoUrl?: string;
    finalVideoKey?: string;
    totalDuration?: number;
    error?: string;
}

export interface LambdaResponse {
    statusCode: number;
    body: {
        success: boolean;
        finalVideoUrl?: string;
        finalVideoKey?: string;
        totalDuration?: number;
        error?: string;
    };
}

// ============================================
// CONFIGURATION
// ============================================

const LAMBDA_FUNCTION_NAME =
    process.env.LAMBDA_MERGER_FUNCTION_NAME || "video-merger";
const LAMBDA_REGION = process.env.AWS_REGION || "us-east-1";

let lambdaClient: LambdaClient | null = null;

function getLambdaClient(): LambdaClient {
    if (!lambdaClient) {
        lambdaClient = new LambdaClient({
            region: LAMBDA_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
    }
    return lambdaClient;
}

/**
 * Check if Lambda merger is configured
 */
export function isLambdaMergerConfigured(): boolean {
    return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.LAMBDA_MERGER_FUNCTION_NAME
    );
}

/**
 * Invoke Lambda function to merge videos
 * This is a synchronous invocation that waits for the result
 */
export async function invokeMergerLambda(
    request: MergeRequest
): Promise<MergeResult> {
    const functionName =
        process.env.LAMBDA_MERGER_FUNCTION_NAME || LAMBDA_FUNCTION_NAME;

    console.log(`[Lambda] Invoking merger function: ${functionName}`);
    console.log(`[Lambda] Job: ${request.jobId}, Clips: ${request.clips.length}`);

    if (!isLambdaMergerConfigured()) {
        return {
            success: false,
            error:
                "Lambda merger not configured. Set LAMBDA_MERGER_FUNCTION_NAME env var.",
        };
    }

    try {
        const client = getLambdaClient();

        const payload = {
            jobId: request.jobId,
            clips: request.clips,
            outputKey: request.outputKey,
            crossfadeDuration: 0,
            bucket: process.env.AWS_S3_BUCKET_NAME,
        };

        console.log(`[Lambda] Payload:`, JSON.stringify(payload, null, 2));

        const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: InvocationType.RequestResponse, // Synchronous
            Payload: Buffer.from(JSON.stringify(payload)),
        });

        const response = await client.send(command);

        // Parse response
        if (response.FunctionError) {
            const errorPayload = response.Payload
                ? JSON.parse(Buffer.from(response.Payload).toString())
                : { errorMessage: "Unknown Lambda error" };
            console.error(`[Lambda] Function error:`, errorPayload);
            return {
                success: false,
                error: errorPayload.errorMessage || "Lambda function error",
            };
        }

        if (!response.Payload) {
            return { success: false, error: "No response from Lambda" };
        }

        const result = JSON.parse(
            Buffer.from(response.Payload).toString()
        ) as LambdaResponse;

        console.log(`[Lambda] Response:`, result);

        if (result.statusCode === 200 && result.body?.success) {
            return {
                success: true,
                finalVideoUrl: result.body.finalVideoUrl,
                finalVideoKey: result.body.finalVideoKey,
                totalDuration: result.body.totalDuration,
            };
        }

        return {
            success: false,
            error: result.body?.error || "Lambda merge failed",
        };
    } catch (error) {
        console.error(`[Lambda] Invocation error:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Lambda invocation failed",
        };
    }
}

/**
 * Invoke Lambda function asynchronously (fire and forget)
 * Use this for non-blocking operation where you poll status later
 */
export async function invokeMergerLambdaAsync(
    request: MergeRequest
): Promise<{ success: boolean; requestId?: string; error?: string }> {
    const functionName =
        process.env.LAMBDA_MERGER_FUNCTION_NAME || LAMBDA_FUNCTION_NAME;

    console.log(`[Lambda] Async invoking merger: ${functionName}`);

    if (!isLambdaMergerConfigured()) {
        return {
            success: false,
            error: "Lambda merger not configured",
        };
    }

    try {
        const client = getLambdaClient();

        const payload = {
            jobId: request.jobId,
            clips: request.clips,
            outputKey: request.outputKey,
            crossfadeDuration: 0,
            bucket: process.env.AWS_S3_BUCKET_NAME,
        };

        const command = new InvokeCommand({
            FunctionName: functionName,
            InvocationType: InvocationType.Event, // Async
            Payload: Buffer.from(JSON.stringify(payload)),
        });

        const response = await client.send(command);

        if (response.StatusCode === 202) {
            console.log(`[Lambda] Async invocation accepted`);
            return {
                success: true,
                requestId: response.$metadata.requestId,
            };
        }

        return {
            success: false,
            error: `Unexpected status code: ${response.StatusCode}`,
        };
    } catch (error) {
        console.error(`[Lambda] Async invocation error:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Lambda invocation failed",
        };
    }
}

/**
 * Helper to build the S3 key for scene videos
 */
export function getSceneS3Key(jobId: string, sceneIndex: number): string {
    return `video-jobs/${jobId}/scenes/scene_${sceneIndex}_raw.mp4`;
}

/**
 * Helper to build the S3 key for final video
 */
export function getFinalVideoS3Key(jobId: string): string {
    return `video-jobs/${jobId}/final/final_video.mp4`;
}
