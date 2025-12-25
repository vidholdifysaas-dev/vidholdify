# 🎬 Lambda Video Merger v6 - Deployment Guide

## Overview

**Lambda v6** includes **Silence Detection & Smart Trimming** to create seamless video merges by automatically detecting and removing silent endings from each scene.

### What it does:
1. **Downloads** all scene videos from S3
2. **Detects silence** at the end of each clip using FFmpeg's `silencedetect` filter
3. **Trims** each clip to remove silent/non-speaking frames
4. **Merges** trimmed clips seamlessly (no awkward pauses!)
5. **Uploads** final video to S3

---

## 🔧 Step-by-Step Deployment

### Step 1: Copy the Lambda Code

```bash
# Navigate to your Lambda directory
cd /Users/harsh/Documents/GitHub/vidholdify/lambda/video-merger

# Backup existing code (optional)
cp index.ts index.ts.backup

# Copy the new Lambda code
cp ../../docs/lambda-v6-silence-trim.ts index.ts
```

### Step 2: Build the Lambda

```bash
# Install dependencies (if not already installed)
npm install

# Build TypeScript to JavaScript
npm run build
```

### Step 3: Create the Deployment Package

```bash
# Create zip with all required files
zip -r function.zip dist/ node_modules/
```

### Step 4: Deploy to AWS Lambda

```bash
# Update the Lambda function code
aws lambda update-function-code \
    --function-name video-merger \
    --zip-file fileb://function.zip \
    --region us-east-1

# Update Lambda configuration (ensure enough timeout and memory)
aws lambda update-function-configuration \
    --function-name video-merger \
    --timeout 300 \
    --memory-size 1024 \
    --region us-east-1
```

### Step 5: Verify Deployment

```bash
# Test with a simple invocation
aws lambda invoke \
    --function-name video-merger \
    --payload '{"jobId":"test","clips":[],"outputKey":"test","bucket":"your-bucket"}' \
    --region us-east-1 \
    /tmp/test-response.json

cat /tmp/test-response.json
```

---

## 🔬 How Silence Detection Works

### FFmpeg Command
```bash
ffmpeg -i scene.mp4 -af silencedetect=n=-30dB:d=0.4 -f null - 2>&1
```

### Parameters:
| Parameter | Value | Description |
|-----------|-------|-------------|
| `n` | `-30dB` | Noise threshold (sounds below this = silence) |
| `d` | `0.4` | Minimum silence duration to detect (seconds) |

### Output Example:
```
[silencedetect @ 0x123] silence_start: 5.234
[silencedetect @ 0x123] silence_end: 7.891
```

This indicates silence starts at 5.234 seconds (speech ends there).

---

## 📊 Trimming Logic

For each scene:
1. Detect original duration (e.g., 8.0 seconds)
2. Detect silence start (e.g., 5.2 seconds)
3. Add buffer (0.3 seconds)
4. Trim to 5.5 seconds

**Result:** Removes 2.5 seconds of silent avatar at end!

### Example Log Output:
```
[Step 2] Detecting silence & trimming clips...
[SilenceDetect] Video duration: 8.00s
[SilenceDetect] Speech ends at: 5.23s
[Trim] Scene 0: 8.00s → 5.53s (cut 2.47s)
[Trim] Scene 1: 7.50s → 6.12s (cut 1.38s)
[Trim] Scene 2: 8.00s → 5.89s (cut 2.11s)
[Trim] Scene 3: 6.00s → 5.45s (cut 0.55s)
```

---

## ⚙️ Configuration Options

You can adjust these values in the Lambda code:

```typescript
// Line 80-82 in index.ts
const noiseThreshold = "-30dB";    // Lower = stricter silence detection
const minSilenceDuration = 0.4;    // Minimum silence to detect (seconds)
const trimBuffer = 0.3;            // Extra time after last word (seconds)
```

### Tuning Tips:
- **Avatar still talking when trimmed?** → Increase `noiseThreshold` to `-25dB`
- **Too abrupt cut?** → Increase `trimBuffer` to `0.5`
- **Detecting speech as silence?** → Increase `minSilenceDuration` to `0.6`

---

## 🐛 Troubleshooting

### Issue: Lambda times out
**Solution:** Increase timeout in AWS Console or CLI:
```bash
aws lambda update-function-configuration \
    --function-name video-merger \
    --timeout 600
```

### Issue: Memory error
**Solution:** Increase memory:
```bash
aws lambda update-function-configuration \
    --function-name video-merger \
    --memory-size 2048
```

### Issue: Silence not detected correctly
**Solution:** Check CloudWatch logs for `[SilenceDetect]` entries and adjust threshold.

---

## 📝 Debug Info

The Lambda now returns debug info in the response:

```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "finalVideoUrl": "https://...",
    "debugInfo": {
      "trimInfo": [
        {
          "sceneIndex": 0,
          "originalDuration": 8.0,
          "silenceStart": 5.23,
          "trimmedDuration": 5.53
        }
      ]
    }
  }
}
```

This helps you understand exactly what was trimmed.

---

## ✅ Verification Checklist

- [ ] Lambda code updated to v6
- [ ] Build completed successfully (`npm run build`)
- [ ] Deployment package created (`function.zip`)
- [ ] Lambda updated on AWS
- [ ] Timeout set to 300+ seconds
- [ ] Memory set to 1024+ MB
- [ ] FFmpeg layer attached to Lambda
- [ ] Test invocation successful

---

## 🔗 Related Files

- **Lambda Code:** `docs/lambda-v6-silence-trim.ts`
- **Lambda Config:** `configs/ai-services/lambda-merger.ts`
- **Architecture:** `docs/NEW_ARCHITECTURE.md`
