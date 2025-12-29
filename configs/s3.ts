import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================
// S3 CLIENT CONFIGURATION
// ============================================

// Lazy initialization - only create client when actually needed
let _s3Client: S3Client | null = null;
let _bucketName: string | null = null;

/**
 * Check if S3 is properly configured
 */
export function isS3Configured(): boolean {
    return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_S3_BUCKET_NAME &&
        process.env.AWS_REGION
    );
}

/**
 * Get S3 client (lazy initialization)
 * Throws error only when actually trying to use S3 without config
 */
function getS3Client(): S3Client {
    if (_s3Client) return _s3Client;

    if (!process.env.AWS_ACCESS_KEY_ID) {
        throw new Error("AWS_ACCESS_KEY_ID environment variable is not set");
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error("AWS_SECRET_ACCESS_KEY environment variable is not set");
    }
    if (!process.env.AWS_REGION) {
        throw new Error("AWS_REGION environment variable is not set");
    }

    _s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    return _s3Client;
}

/**
 * Get bucket name (lazy initialization)
 */
function getBucketName(): string {
    if (_bucketName) return _bucketName;

    if (!process.env.AWS_S3_BUCKET_NAME) {
        throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
    }

    _bucketName = process.env.AWS_S3_BUCKET_NAME;
    return _bucketName;
}

// ============================================
// S3 PATH STRUCTURE
// ============================================

/**
 * S3 folder structure:
 * video-jobs/{jobId}/
 *   reference/       - Original uploaded reference image
 *   scenes/          - Individual scene videos (raw and trimmed)
 *   audio/           - TTS narration audio
 *   final/           - Final stitched video
 */

export const getS3Paths = (jobId: string) => ({
    reference: `video-jobs/${jobId}/reference`,
    scenes: `video-jobs/${jobId}/scenes`,
    audio: `video-jobs/${jobId}/audio`,
    final: `video-jobs/${jobId}/final`,
});

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload a file to S3
 * @param key - S3 object key (path)
 * @param body - File content as Buffer
 * @param contentType - MIME type of the file
 * @param isPublic - Whether the file should be publicly accessible (default: true)
 * @returns S3 URL of the uploaded file
 */
export async function uploadToS3(
    key: string,
    body: Buffer,
    contentType: string,
    isPublic: boolean = true
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        Body: body,
        ContentType: contentType,
        // Make file publicly readable if specified
        ...(isPublic && { ACL: "public-read" }),
    });

    await getS3Client().send(command);

    // Return the direct S3 URL
    return `https://${getBucketName()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Upload reference image for a video job
 */
export async function uploadReferenceImage(
    jobId: string,
    imageBuffer: Buffer,
    filename: string
): Promise<string> {
    const extension = filename.split(".").pop() || "png";
    const key = `${getS3Paths(jobId).reference}/reference.${extension}`;
    const contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;

    return uploadToS3(key, imageBuffer, contentType);
}

/**
 * Upload scene video (raw or trimmed)
 */
export async function uploadSceneVideo(
    jobId: string,
    sceneIndex: number,
    videoBuffer: Buffer,
    isTrimmed: boolean = false
): Promise<string> {
    const suffix = isTrimmed ? "trimmed" : "raw";
    const key = `${getS3Paths(jobId).scenes}/scene_${sceneIndex}_${suffix}.mp4`;

    return uploadToS3(key, videoBuffer, "video/mp4");
}

/**
 * Upload TTS narration audio
 */
export async function uploadNarrationAudio(
    jobId: string,
    audioBuffer: Buffer,
    format: string = "mp3"
): Promise<string> {
    const key = `${getS3Paths(jobId).audio}/narration.${format}`;
    const contentType = format === "mp3" ? "audio/mpeg" : `audio/${format}`;

    return uploadToS3(key, audioBuffer, contentType);
}

/**
 * Upload final stitched video
 */
export async function uploadFinalVideo(
    jobId: string,
    videoBuffer: Buffer
): Promise<string> {
    const key = `${getS3Paths(jobId).final}/final_video.mp4`;

    return uploadToS3(key, videoBuffer, "video/mp4");
}

// ============================================
// DOWNLOAD FUNCTIONS
// ============================================

/**
 * Get a file from S3 as a Buffer
 */
export async function getFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    });

    const response = await getS3Client().send(command);

    if (!response.Body) {
        throw new Error(`No body returned from S3 for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}

/**
 * Download file from S3 URL to buffer
 */
export async function downloadFromS3Url(s3Url: string): Promise<Buffer> {
    // Extract key from S3 URL
    const url = new URL(s3Url);
    const key = url.pathname.slice(1); // Remove leading slash

    return getFromS3(key);
}

// ============================================
// SIGNED URL FUNCTIONS
// ============================================

/**
 * Generate a presigned URL for secure playback
 * @param key - S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 */
export async function getSignedPlaybackUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    });

    return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Generate a presigned URL from a full S3 URL
 */
export async function getSignedUrlFromS3Url(
    s3Url: string,
    expiresIn: number = 3600
): Promise<string> {
    const url = new URL(s3Url);
    // Decode key to handle special characters (e.g. parens, spaces)
    const key = decodeURIComponent(url.pathname.slice(1));

    return getSignedPlaybackUrl(key, expiresIn);
}

/**
 * Generate a presigned upload URL for direct client uploads
 * @param key - S3 object key
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 */
export async function getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Generate presigned upload URL for reference image
 */
export async function getPresignedReferenceUploadUrl(
    jobId: string,
    filename: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
    const extension = filename.split(".").pop() || "png";
    const key = `${getS3Paths(jobId).reference}/reference.${extension}`;
    const contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;

    const uploadUrl = await getSignedUploadUrl(key, contentType);
    const fileUrl = `https://${getBucketName()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if an object exists in S3
 */
export async function objectExists(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: getBucketName(),
            Key: key,
        });
        await getS3Client().send(command);
        return true;
    } catch {
        return false;
    }
}

/**
 * Delete an object from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: key,
    });

    await getS3Client().send(command);
}

/**
 * List objects in a specific folder (prefix)
 */
export async function listS3Folder(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
    });

    const response = await getS3Client().send(command);

    if (!response.Contents) {
        return [];
    }

    // Filter out directories (keys ending with /) and map to keys
    return response.Contents
        .map((item) => item.Key || "")
        .filter((key) => key && !key.endsWith("/"));
}

/**
 * Extract S3 key from a full S3 URL
 */
export function extractKeyFromS3Url(s3Url: string): string {
    const url = new URL(s3Url);
    return url.pathname.slice(1);
}

// Export getter functions for advanced use cases
export { getS3Client, getBucketName };
