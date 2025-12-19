# Lambda FFmpeg Video Merger - Deployment Guide

This Lambda function merges scene videos using FFmpeg with crossfade transitions.

## Architecture

```
Next.js API (Vercel)
    │
    │  1. Generate scenes with Replicate Veo-3-fast
    │  2. Upload scenes to S3
    │  3. Invoke Lambda
    │
    ▼
┌─────────────────────────────────────────────────┐
│                AWS Lambda                        │
│                                                  │
│  1. Download scene videos from S3               │
│  2. Merge with FFmpeg (crossfade transitions)   │
│  3. Upload final video to S3                    │
│  4. Return final video URL                      │
│                                                  │
│  Uses: FFmpeg Lambda Layer                       │
└─────────────────────────────────────────────────┘
```

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js 18+ installed
3. An S3 bucket for video storage

## Step 1: Create the Lambda Function

### Option A: Using AWS Console

1. Go to AWS Lambda Console
2. Create function → Author from scratch
3. Settings:
   - Function name: `video-merger`
   - Runtime: Node.js 18.x
   - Architecture: x86_64
   - Execution role: Create new role with S3 permissions

### Option B: Using AWS CLI

```bash
# Create the execution role first (use existing role if you have one)
aws iam create-role \
  --role-name video-merger-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach S3 and CloudWatch policies
aws iam attach-role-policy \
  --role-name video-merger-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name video-merger-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## Step 2: Add FFmpeg Layer

You need an FFmpeg layer for Lambda. Options:

### Option A: Use a Public FFmpeg Layer

Add this layer ARN (check for your region):

```
arn:aws:lambda:us-east-1:764866452798:layer:ffmpeg:1
```

### Option B: Create Your Own Layer

```bash
# Download FFmpeg static build
mkdir -p ffmpeg-layer/bin
cd ffmpeg-layer

# Download from https://johnvansickle.com/ffmpeg/
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg bin/
cp ffmpeg-*-amd64-static/ffprobe bin/

# Create layer zip
zip -r ffmpeg-layer.zip bin/

# Upload to Lambda
aws lambda publish-layer-version \
  --layer-name ffmpeg \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes nodejs18.x \
  --compatible-architectures x86_64
```

## Step 3: Build and Deploy the Function

```bash
cd lambda/video-merger

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create deployment package
npm run package

# Deploy to Lambda
aws lambda update-function-code \
  --function-name video-merger \
  --zip-file fileb://function.zip
```

## Step 4: Configure Lambda

### Memory and Timeout

Video processing needs more resources:

```bash
aws lambda update-function-configuration \
  --function-name video-merger \
  --memory-size 1024 \
  --timeout 300
```

Recommended settings:
- **Memory**: 1024 MB (minimum), 2048 MB for faster processing
- **Timeout**: 300 seconds (5 minutes)

### Environment Variables

```bash
aws lambda update-function-configuration \
  --function-name video-merger \
  --environment "Variables={
    FFMPEG_PATH=/opt/bin/ffmpeg,
    FFPROBE_PATH=/opt/bin/ffprobe
  }"
```

### Add the FFmpeg Layer

```bash
aws lambda update-function-configuration \
  --function-name video-merger \
  --layers arn:aws:lambda:YOUR_REGION:ACCOUNT_ID:layer:ffmpeg:VERSION
```

## Step 5: Configure Next.js Environment

Add these to your `.env.local`:

```env
# Lambda Merger Configuration
LAMBDA_MERGER_FUNCTION_NAME=video-merger

# Replicate API for Veo-3-fast
REPLICATE_API_KEY=your_replicate_token

# AWS Configuration (should already have these)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

## Step 6: Test the Integration

### Test Lambda Directly

```bash
aws lambda invoke \
  --function-name video-merger \
  --payload '{
    "jobId": "test-job-123",
    "bucket": "your-bucket-name",
    "clips": [
      {"s3Key": "video-jobs/test/scene_0.mp4", "sceneIndex": 0, "duration": 6},
      {"s3Key": "video-jobs/test/scene_1.mp4", "sceneIndex": 1, "duration": 6}
    ],
    "outputKey": "video-jobs/test/final/test.mp4",
    "crossfadeDuration": 0.3
  }' \
  response.json

cat response.json
```

### Test Full Flow via API

```bash
curl -X POST http://localhost:3000/api/manual-video/generate \
  -H "Content-Type: application/json" \
  -d '{"jobId": "YOUR_JOB_ID"}'
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NEW FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  VERCEL (Next.js API)                                               │
│  ────────────────────                                               │
│  1. Generate reference image (Nano Banana)                          │
│  2. Generate script (Gemini)                                        │
│  3. Generate 5 scenes (Replicate Veo-3-fast) ← SAME ref image      │
│  4. Upload scenes to S3                                             │
│  5. Invoke Lambda (synchronous)                                     │
│                                                                      │
│                          │                                          │
│                          ▼                                          │
│                                                                      │
│  AWS LAMBDA (FFmpeg)                                                │
│  ──────────────────                                                 │
│  1. Download scenes from S3                                         │
│  2. Merge with crossfade (FFmpeg)                                   │
│  3. Upload final video to S3                                        │
│  4. Return URL                                                      │
│                                                                      │
│                          │                                          │
│                          ▼                                          │
│                                                                      │
│  S3 BUCKET                                                          │
│  ─────────                                                          │
│  video-jobs/{jobId}/                                                │
│    ├── reference/reference.png                                      │
│    ├── scenes/scene_0_raw.mp4                                      │
│    ├── scenes/scene_1_raw.mp4                                      │
│    ├── scenes/scene_2_raw.mp4                                      │
│    ├── scenes/scene_3_raw.mp4                                      │
│    ├── scenes/scene_4_raw.mp4                                      │
│    └── final/final_video.mp4                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Differences from Old Architecture

| Aspect | Old (Worker) | New (Lambda) |
|--------|-------------|--------------|
| Veo Generation | Worker (ECS) | Next.js API (Vercel) |
| FFmpeg Merge | Worker (ECS) | Lambda |
| Infrastructure | Long-running server | Serverless |
| Cost | Fixed (ECS) | Pay-per-use |
| Reference Image | Per job | SAME for all scenes |
| Queue | SQS | Direct invoke |

## Troubleshooting

### Lambda Timeout

If merging takes too long:
- Increase Lambda timeout to 600 seconds (10 min)
- Increase memory to 2048 MB or 3008 MB
- Check if scene videos are too large

### FFmpeg Not Found

Ensure:
- FFmpeg layer is attached
- FFMPEG_PATH is set to `/opt/bin/ffmpeg`
- Layer is compatible with Lambda architecture (x86_64)

### Memory Issues

Video processing is memory-intensive:
- Use at least 1024 MB
- For 5 scenes with crossfade, 2048 MB recommended

### Permission Errors

Ensure Lambda role has:
- `s3:GetObject` permission on source bucket
- `s3:PutObject` permission on destination bucket
- CloudWatch Logs permissions

## Cost Estimation

Lambda costs for video processing (5 scenes, ~30s video):
- Memory: 2048 MB
- Duration: ~60-120 seconds
- Cost: ~$0.002 per video

S3 costs:
- Storage: ~50 MB per video
- Transfer: Minimal (stay in same region)

## Files Created

```
vidholdify/
├── configs/ai-services/
│   ├── replicate-veo.ts      # Replicate Veo-3-fast integration
│   └── lambda-merger.ts       # Lambda invocation service
├── app/api/manual-video/
│   └── generate/route.ts      # New full generation endpoint
└── lambda/video-merger/
    ├── index.ts              # Lambda function code
    ├── package.json
    └── tsconfig.json
```
