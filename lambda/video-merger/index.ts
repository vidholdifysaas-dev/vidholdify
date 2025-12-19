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

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ============================================
// TYPES
// ============================================

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

// ============================================
// CONFIGURATION
// ============================================

const FFMPEG_PATH = process.env.FFMPEG_PATH || "/opt/bin/ffmpeg";
const TMP_DIR = "/tmp";

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
});

// ============================================
// MAIN HANDLER
// ============================================

export const handler = async (event: MergeEvent): Promise<MergeResponse> => {
    const { jobId, bucket, clips, outputKey, crossfadeDuration = 0.3 } = event;

    console.log(`[Lambda] Starting merge for job: ${jobId}`);
    console.log(`[Lambda] Bucket: ${bucket}, Clips: ${clips.length}`);

    // Create job temp directory
    const jobDir = path.join(TMP_DIR, jobId);
    if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
    }

    try {
        // ========================================
        // STEP 1: Download all scene videos from S3
        // ========================================
        console.log("[Lambda] Step 1: Downloading scene videos from S3...");

        const sortedClips = [...clips].sort((a, b) => a.sceneIndex - b.sceneIndex);
        const localPaths: string[] = [];
        const durations: number[] = [];

        for (const clip of sortedClips) {
            const localPath = path.join(jobDir, `scene_${clip.sceneIndex}.mp4`);

            console.log(`[Lambda] Downloading: ${clip.s3Key}`);

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: clip.s3Key,
            });

            const response = await s3Client.send(command);

            if (!response.Body) {
                throw new Error(`No body in S3 response for ${clip.s3Key}`);
            }

            // Write to local file
            const stream = response.Body as NodeJS.ReadableStream;
            const chunks: Buffer[] = [];

            for await (const chunk of stream) {
                chunks.push(chunk as Buffer);
            }

            fs.writeFileSync(localPath, Buffer.concat(chunks));
            console.log(`[Lambda] Downloaded: ${localPath}`);

            localPaths.push(localPath);
            durations.push(clip.duration);
        }

        // ========================================
        // STEP 2: Merge videos with FFmpeg
        // ========================================
        console.log("[Lambda] Step 2: Merging videos with FFmpeg...");

        const finalPath = path.join(jobDir, "final.mp4");

        if (localPaths.length === 1) {
            // Single video, just copy
            fs.copyFileSync(localPaths[0], finalPath);
        } else {
            // Multiple videos, merge with crossfade
            await mergeWithCrossfade(
                localPaths,
                durations,
                finalPath,
                crossfadeDuration
            );
        }

        // Get final video duration
        const totalDuration = await getVideoDuration(finalPath);
        console.log(`[Lambda] Final video duration: ${totalDuration}s`);

        // ========================================
        // STEP 3: Upload final video to S3
        // ========================================
        console.log("[Lambda] Step 3: Uploading final video to S3...");

        const finalVideoBuffer = fs.readFileSync(finalPath);

        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: outputKey,
            Body: finalVideoBuffer,
            ContentType: "video/mp4",
        });

        await s3Client.send(putCommand);

        const finalVideoUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${outputKey}`;
        console.log(`[Lambda] Final video uploaded: ${finalVideoUrl}`);

        // Cleanup
        cleanupJobDir(jobDir);

        return {
            statusCode: 200,
            body: {
                success: true,
                finalVideoUrl,
                finalVideoKey: outputKey,
                totalDuration,
            },
        };
    } catch (error) {
        console.error("[Lambda] Error:", error);

        // Cleanup on error
        cleanupJobDir(jobDir);

        return {
            statusCode: 500,
            body: {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
};

// ============================================
// FFMPEG FUNCTIONS
// ============================================

/**
 * Merge videos with crossfade transitions
 */
async function mergeWithCrossfade(
    inputPaths: string[],
    durations: number[],
    outputPath: string,
    crossfadeDuration: number
): Promise<void> {
    console.log(`[FFmpeg] Merging ${inputPaths.length} videos with ${crossfadeDuration}s crossfade`);

    // Build FFmpeg complex filter
    const { filterComplex, outputMaps } = buildCrossfadeFilter(
        inputPaths.length,
        durations,
        crossfadeDuration
    );

    // Build FFmpeg arguments
    const args: string[] = [];

    // Add inputs
    for (const inputPath of inputPaths) {
        args.push("-i", inputPath);
    }

    // Add filter complex
    args.push("-filter_complex", filterComplex);

    // Add output maps and encoding options
    args.push(...outputMaps);
    args.push(
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-y",
        outputPath
    );

    console.log(`[FFmpeg] Command: ffmpeg ${args.slice(0, 20).join(" ")}...`);

    await runFFmpeg(args);
}

/**
 * Build FFmpeg complex filter for crossfade
 */
function buildCrossfadeFilter(
    clipCount: number,
    durations: number[],
    crossfadeDuration: number
): { filterComplex: string; outputMaps: string[] } {
    if (clipCount < 2) {
        return {
            filterComplex: "[0:v]null[outv];[0:a]anull[outa]",
            outputMaps: ["-map", "[outv]", "-map", "[outa]"],
        };
    }

    const filters: string[] = [];
    let lastVideoOutput = "[0:v]";
    let lastAudioOutput = "[0:a]";

    let cumulativeDuration = durations[0];

    for (let i = 1; i < clipCount; i++) {
        const currentVideoInput = `[${i}:v]`;
        const currentAudioInput = `[${i}:a]`;

        const videoOutputLabel = i === clipCount - 1 ? "[outv]" : `[v${i}]`;
        const audioOutputLabel = i === clipCount - 1 ? "[outa]" : `[a${i}]`;

        const offset = cumulativeDuration - crossfadeDuration;

        console.log(`[FFmpeg] Crossfade ${i}: offset=${offset.toFixed(2)}s`);

        // Video crossfade
        filters.push(
            `${lastVideoOutput}${currentVideoInput}xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset.toFixed(3)}${videoOutputLabel}`
        );

        // Audio crossfade
        filters.push(
            `${lastAudioOutput}${currentAudioInput}acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri${audioOutputLabel}`
        );

        lastVideoOutput = videoOutputLabel;
        lastAudioOutput = audioOutputLabel;

        cumulativeDuration += durations[i] - crossfadeDuration;
    }

    return {
        filterComplex: filters.join(";"),
        outputMaps: ["-map", "[outv]", "-map", "[outa]"],
    };
}

/**
 * Run FFmpeg command
 */
function runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn(FFMPEG_PATH, args);

        let stderr = "";

        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        process.on("close", (code) => {
            if (code === 0) {
                console.log("[FFmpeg] Completed successfully");
                resolve();
            } else {
                console.error("[FFmpeg] Failed:", stderr.slice(-1000));
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        process.on("error", (error) => {
            reject(new Error(`FFmpeg spawn error: ${error.message}`));
        });
    });
}

/**
 * Get video duration using FFprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
    const ffprobePath = process.env.FFPROBE_PATH || "/opt/bin/ffprobe";

    return new Promise((resolve) => {
        const args = [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            videoPath,
        ];

        const process = spawn(ffprobePath, args);
        let stdout = "";
        let stderr = "";

        process.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        process.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        process.on("close", (code) => {
            if (code === 0) {
                const duration = parseFloat(stdout.trim());
                resolve(isNaN(duration) ? 0 : duration);
            } else {
                console.warn("[FFprobe] Error:", stderr);
                resolve(0); // Don't fail on duration detection
            }
        });

        process.on("error", (error) => {
            console.warn("[FFprobe] Spawn error:", error);
            resolve(0);
        });
    });
}

/**
 * Cleanup job directory
 */
function cleanupJobDir(jobDir: string): void {
    try {
        if (fs.existsSync(jobDir)) {
            const files = fs.readdirSync(jobDir);
            for (const file of files) {
                fs.unlinkSync(path.join(jobDir, file));
            }
            fs.rmdirSync(jobDir);
            console.log(`[Lambda] Cleaned up: ${jobDir}`);
        }
    } catch (error) {
        console.warn("[Lambda] Cleanup error:", error);
    }
}
