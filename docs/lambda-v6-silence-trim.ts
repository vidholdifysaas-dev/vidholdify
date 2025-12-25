/**
 * Lambda Video Merger v6 - With Silence Detection & Smart Trimming
 * 
 * This version:
 * 1. Downloads all scene videos from S3
 * 2. Detects silence at the end of each clip (where avatar stops speaking)
 * 3. Trims each clip to remove silent endings
 * 4. Merges trimmed clips with seamless transitions
 * 5. Uploads final video to S3
 * 
 * DEPLOYMENT:
 * 1. Copy this file to lambda/video-merger/index.ts
 * 2. Run: npm run build
 * 3. Run: ./deploy.sh
 */

import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { execSync, exec } from "child_process";
import { createWriteStream, readFileSync, unlinkSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { promisify } from "util";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";

const execAsync = promisify(exec);

// ============================================
// TYPES
// ============================================

interface ClipInput {
    s3Key: string;
    sceneIndex: number;
    duration: number;
}

interface MergeInput {
    jobId: string;
    clips: ClipInput[];
    outputKey: string;
    crossfadeDuration?: number;
    bucket: string;
}

interface MergeOutput {
    statusCode: number;
    body: {
        success: boolean;
        finalVideoUrl?: string;
        finalVideoKey?: string;
        totalDuration?: number;
        error?: string;
        debugInfo?: {
            trimInfo: Array<{
                sceneIndex: number;
                originalDuration: number;
                silenceStart: number;
                trimmedDuration: number;
            }>;
        };
    };
}

// ============================================
// S3 CLIENT
// ============================================

const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
});

// ============================================
// SILENCE DETECTION
// ============================================

/**
 * Detect where silence begins in a video (i.e., where speech ends)
 * Uses FFmpeg's silencedetect filter
 * 
 * @param inputPath - Path to the video file
 * @param noiseThreshold - Silence threshold in dB (default: -30dB)
 * @param minSilenceDuration - Minimum silence duration to detect (default: 0.4s)
 * @returns Timestamp where silence starts (speech ends), or video duration if no silence
 */
async function detectSilenceStart(
    inputPath: string,
    noiseThreshold: string = "-30dB",
    minSilenceDuration: number = 0.4
): Promise<number> {
    try {
        // Get video duration first
        const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
        const { stdout: durationOutput } = await execAsync(durationCmd);
        const videoDuration = parseFloat(durationOutput.trim());

        console.log(`[SilenceDetect] Video duration: ${videoDuration}s`);

        // Run silence detection
        // The silencedetect filter outputs lines like:
        // [silencedetect @ 0x...] silence_start: 5.234
        // [silencedetect @ 0x...] silence_end: 7.891
        const silenceCmd = `ffmpeg -i "${inputPath}" -af silencedetect=n=${noiseThreshold}:d=${minSilenceDuration} -f null - 2>&1`;

        const { stdout: silenceOutput, stderr: silenceStderr } = await execAsync(silenceCmd, {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for long outputs
        });

        const combinedOutput = silenceOutput + silenceStderr;

        // Find all silence_start timestamps
        const silenceStartRegex = /silence_start:\s*([\d.]+)/g;
        const matches = [...combinedOutput.matchAll(silenceStartRegex)];

        if (matches.length === 0) {
            console.log(`[SilenceDetect] No silence detected, using full duration: ${videoDuration}s`);
            return videoDuration;
        }

        // Get the LAST silence_start (the final silence at the end of the video)
        const lastSilenceStart = parseFloat(matches[matches.length - 1][1]);

        // Only use this if it's near the end of the video (within last 50%)
        // This prevents trimming if silence is detected in the middle of speech
        const isNearEnd = lastSilenceStart > videoDuration * 0.5;

        if (isNearEnd) {
            console.log(`[SilenceDetect] speech ends at: ${lastSilenceStart}s`);
            return lastSilenceStart;
        } else {
            console.log(`[SilenceDetect] Silence at ${lastSilenceStart}s is not near end, using full duration`);
            return videoDuration;
        }
    } catch (error) {
        console.error(`[SilenceDetect] Error:`, error);
        // Fallback: return a large number to avoid trimming
        return 999;
    }
}

/**
 * Get the duration of a video file
 */
async function getVideoDuration(inputPath: string): Promise<number> {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    const { stdout } = await execAsync(cmd);
    return parseFloat(stdout.trim());
}

/**
 * Trim video to remove silent ending
 * 
 * @param inputPath - Input video path
 * @param outputPath - Output video path
 * @param trimEnd - Timestamp to trim to (seconds)
 * @param buffer - Extra buffer after speech ends (default: 0.3s)
 */
async function trimToSpeechEnd(
    inputPath: string,
    outputPath: string,
    trimEnd: number,
    buffer: number = 0.3
): Promise<void> {
    const actualTrimEnd = trimEnd + buffer;

    console.log(`[Trim] Trimming ${inputPath} to ${actualTrimEnd}s`);

    // Use -c copy for fast trimming (no re-encoding)
    // If there are sync issues, can fallback to re-encoding
    const cmd = `ffmpeg -y -i "${inputPath}" -t ${actualTrimEnd} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;

    await execAsync(cmd);

    console.log(`[Trim] Created trimmed file: ${outputPath}`);
}

// ============================================
// S3 OPERATIONS
// ============================================

/**
 * Download file from S3 to local path
 */
async function downloadFromS3(
    bucket: string,
    key: string,
    localPath: string
): Promise<void> {
    console.log(`[S3] Downloading s3://${bucket}/${key} to ${localPath}`);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(command);

    if (!response.Body) {
        throw new Error(`Empty response body for ${key}`);
    }

    const writeStream = createWriteStream(localPath);
    await pipeline(response.Body as Readable, writeStream);

    console.log(`[S3] Downloaded: ${key}`);
}

/**
 * Upload file to S3
 */
async function uploadToS3(
    bucket: string,
    key: string,
    localPath: string
): Promise<string> {
    console.log(`[S3] Uploading ${localPath} to s3://${bucket}/${key}`);

    const fileContent = readFileSync(localPath);

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: "video/mp4",
    });

    await s3Client.send(command);

    const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    console.log(`[S3] Uploaded: ${url}`);

    return url;
}

// ============================================
// FFMPEG MERGE
// ============================================

/**
 * Build FFmpeg filter complex for merging with crossfades
 */
function buildFilterComplex(
    clipCount: number,
    crossfadeDuration: number
): string {
    if (clipCount === 1) {
        return "[0:v]copy[outv];[0:a]acopy[outa]";
    }

    let filterParts: string[] = [];
    let lastVideoLabel = "0:v";
    let lastAudioLabel = "0:a";

    for (let i = 1; i < clipCount; i++) {
        const videoOutLabel = i === clipCount - 1 ? "outv" : `v${i}`;
        const audioOutLabel = i === clipCount - 1 ? "outa" : `a${i}`;

        // Video crossfade
        filterParts.push(
            `[${lastVideoLabel}][${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=0[${videoOutLabel}]`
        );

        // Audio crossfade
        filterParts.push(
            `[${lastAudioLabel}][${i}:a]acrossfade=d=${crossfadeDuration}:c1=tri:c2=tri[${audioOutLabel}]`
        );

        lastVideoLabel = videoOutLabel;
        lastAudioLabel = audioOutLabel;
    }

    return filterParts.join(";");
}

/**
 * Alternative merge: Concatenate without crossfade (more reliable)
 * Uses the concat demuxer
 */
async function mergeWithConcat(
    inputPaths: string[],
    outputPath: string
): Promise<void> {
    // Create concat file
    const concatFilePath = "/tmp/concat.txt";
    const concatContent = inputPaths.map(p => `file '${p}'`).join("\n");

    require("fs").writeFileSync(concatFilePath, concatContent);
    console.log(`[FFmpeg] Concat file:\n${concatContent}`);

    // Merge using concat demuxer
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;

    console.log(`[FFmpeg] Running: ${cmd}`);
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
}

/**
 * Merge with crossfades using filter_complex
 */
async function mergeWithCrossfade(
    inputPaths: string[],
    outputPath: string,
    crossfadeDuration: number
): Promise<void> {
    if (inputPaths.length === 1) {
        // Just copy single file
        execSync(`cp "${inputPaths[0]}" "${outputPath}"`);
        return;
    }

    // Build input arguments
    const inputArgs = inputPaths.map((p) => `-i "${p}"`).join(" ");

    // Build filter complex
    const filterComplex = buildFilterComplex(inputPaths.length, crossfadeDuration);

    const cmd = `ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${outputPath}"`;

    console.log(`[FFmpeg] Running merge command`);
    await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });
}

// ============================================
// CLEANUP
// ============================================

function cleanupTmpFiles(directory: string = "/tmp", prefix: string = "scene_"): void {
    try {
        const files = readdirSync(directory);
        for (const file of files) {
            if (file.startsWith(prefix) || file === "concat.txt" || file.startsWith("trimmed_")) {
                const filePath = path.join(directory, file);
                if (statSync(filePath).isFile()) {
                    unlinkSync(filePath);
                    console.log(`[Cleanup] Deleted: ${filePath}`);
                }
            }
        }
    } catch (error) {
        console.warn(`[Cleanup] Error:`, error);
    }
}

// ============================================
// MAIN HANDLER
// ============================================

export const handler = async (event: MergeInput): Promise<MergeOutput> => {
    console.log("=".repeat(60));
    console.log("[Lambda] Video Merger v6 - Silence Detection & Trim");
    console.log("=".repeat(60));
    console.log(`[Lambda] JobId: ${event.jobId}`);
    console.log(`[Lambda] Clips: ${event.clips.length}`);
    console.log(`[Lambda] Bucket: ${event.bucket}`);
    console.log(`[Lambda] OutputKey: ${event.outputKey}`);

    // Cleanup any previous files
    cleanupTmpFiles();

    try {
        const { jobId, clips, outputKey, bucket, crossfadeDuration = 0 } = event;

        if (!clips || clips.length === 0) {
            return {
                statusCode: 400,
                body: { success: false, error: "No clips provided" },
            };
        }

        // Sort clips by scene index
        const sortedClips = [...clips].sort((a, b) => a.sceneIndex - b.sceneIndex);

        // ============================================
        // STEP 1: Download all clips
        // ============================================
        console.log("\n[Step 1] Downloading clips from S3...");

        const downloadedPaths: string[] = [];
        for (const clip of sortedClips) {
            const localPath = `/tmp/scene_${clip.sceneIndex}_raw.mp4`;
            await downloadFromS3(bucket, clip.s3Key, localPath);
            downloadedPaths.push(localPath);
        }

        // ============================================
        // STEP 2: Detect silence and trim each clip
        // ============================================
        console.log("\n[Step 2] Detecting silence & trimming clips...");

        const trimmedPaths: string[] = [];
        const trimInfo: Array<{
            sceneIndex: number;
            originalDuration: number;
            silenceStart: number;
            trimmedDuration: number;
        }> = [];

        for (let i = 0; i < downloadedPaths.length; i++) {
            const inputPath = downloadedPaths[i];
            const outputPath = `/tmp/trimmed_${sortedClips[i].sceneIndex}.mp4`;

            // Get original duration
            const originalDuration = await getVideoDuration(inputPath);

            // Detect where speech ends
            const silenceStart = await detectSilenceStart(inputPath);

            // Trim to speech end (with 0.3s buffer)
            await trimToSpeechEnd(inputPath, outputPath, silenceStart, 0.3);

            // Get trimmed duration
            const trimmedDuration = await getVideoDuration(outputPath);

            trimmedPaths.push(outputPath);
            trimInfo.push({
                sceneIndex: sortedClips[i].sceneIndex,
                originalDuration,
                silenceStart,
                trimmedDuration,
            });

            console.log(`[Trim] Scene ${sortedClips[i].sceneIndex}: ${originalDuration.toFixed(2)}s → ${trimmedDuration.toFixed(2)}s (cut ${(originalDuration - trimmedDuration).toFixed(2)}s)`);
        }

        // ============================================
        // STEP 3: Merge trimmed clips
        // ============================================
        console.log("\n[Step 3] Merging trimmed clips...");

        const finalLocalPath = `/tmp/final_${jobId}.mp4`;

        // Use concat for more reliable merging (no crossfade issues)
        // If you want crossfades, use mergeWithCrossfade instead
        if (crossfadeDuration > 0) {
            await mergeWithCrossfade(trimmedPaths, finalLocalPath, crossfadeDuration);
        } else {
            await mergeWithConcat(trimmedPaths, finalLocalPath);
        }

        // ============================================
        // STEP 4: Get final video info
        // ============================================
        const totalDuration = await getVideoDuration(finalLocalPath);
        console.log(`[Final] Total duration: ${totalDuration.toFixed(2)}s`);

        // ============================================
        // STEP 5: Upload to S3
        // ============================================
        console.log("\n[Step 4] Uploading final video to S3...");

        const finalVideoUrl = await uploadToS3(bucket, outputKey, finalLocalPath);

        // ============================================
        // STEP 6: Cleanup
        // ============================================
        console.log("\n[Step 5] Cleaning up...");
        cleanupTmpFiles();

        // ============================================
        // RETURN SUCCESS
        // ============================================
        console.log("\n" + "=".repeat(60));
        console.log("[Lambda] SUCCESS!");
        console.log("=".repeat(60));

        return {
            statusCode: 200,
            body: {
                success: true,
                finalVideoUrl,
                finalVideoKey: outputKey,
                totalDuration,
                debugInfo: {
                    trimInfo,
                },
            },
        };
    } catch (error) {
        console.error("[Lambda] ERROR:", error);

        // Cleanup on error
        cleanupTmpFiles();

        return {
            statusCode: 500,
            body: {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
};

// CommonJS export for AWS Lambda compatibility
module.exports = { handler };

