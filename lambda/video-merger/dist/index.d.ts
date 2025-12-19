/**
 * Lambda FFmpeg Video Merger
 *
 * AWS Lambda function that merges scene videos using FFmpeg.
 * Deployed with FFmpeg layer for video processing.
 *
 * Flow:
 * 1. Receive S3 keys for scene videos
 * 2. Download all scene videos from S3
 * 3. Merge with crossfade transitions using FFmpeg
 * 4. Upload final video to S3
 * 5. Return final video URL
 *
 * Environment Variables:
 * - AWS_REGION
 * - (AWS credentials are provided by Lambda execution role)
 */
interface MergeEvent {
    jobId: string;
    bucket: string;
    clips: Array<{
        s3Key: string;
        sceneIndex: number;
        duration: number;
    }>;
    outputKey: string;
    crossfadeDuration?: number;
}
interface MergeResponse {
    statusCode: number;
    body: {
        success: boolean;
        finalVideoUrl?: string;
        finalVideoKey?: string;
        totalDuration?: number;
        error?: string;
    };
}
export declare const handler: (event: MergeEvent) => Promise<MergeResponse>;
export {};
