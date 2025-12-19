# 🎬 Video Generation Architecture

## Complete Flow: Replicate → S3 → Lambda Merge

```
┌──────────────────────────────┐
│        USER BROWSER          │
│  Selects: 15s / 30s / 45s    │
│  Clicks "Generate Video"     │
└───────────────┬──────────────┘
                │ HTTP POST /api/manual-video/generate
                ▼
┌──────────────────────────────────────────────────────────────┐
│                     NEXT.JS API (Vercel)                     │
│  /api/manual-video/generate                                  │
│                                                              │
│  1. Generate Reference Image (Nano Banana)                   │
│     └── Single image: avatar + product + background         │
│                                                              │
│  2. Generate Script & Scene Plan (Gemini)                    │
│     ├── 15s → 2 scenes                                       │
│     ├── 30s → 4 scenes                                       │
│     └── 45s → 5 scenes                                       │
│                                                              │
│  3. Call Replicate (Veo-3-fast) for each scene              │
│     └── SAME reference image for ALL scenes (consistency)   │
└───────────────┬──────────────────────────────────────────────┘
                │ Replicate API Calls (sequential)
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    REPLICATE (Veo-3-fast)                    │
│                                                              │
│  GPU Video Generation per Scene                              │
│  - Uses reference image for avatar consistency              │
│  - Generates video WITH audio (spoken dialogue)             │
│  - Returns temporary .mp4 URLs                              │
│                                                              │
│  Scene 1: 8s ████████████████████████                      │
│  Scene 2: 8s ████████████████████████                      │
│  Scene 3: 8s ████████████████████████                      │
│  Scene 4: 6s ██████████████████                            │
│                                                              │
└───────────────┬──────────────────────────────────────────────┘
                │ Download each .mp4
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS API (continues)                   │
│                                                              │
│  4. Download videos from Replicate temporary URLs           │
│                                                              │
│  5. Upload to S3:                                           │
│     s3://bucket/video-jobs/{jobId}/scenes/scene_0_raw.mp4   │
│     s3://bucket/video-jobs/{jobId}/scenes/scene_1_raw.mp4   │
│     s3://bucket/video-jobs/{jobId}/scenes/scene_2_raw.mp4   │
│     s3://bucket/video-jobs/{jobId}/scenes/scene_3_raw.mp4   │
│                                                              │
│  6. Invoke Lambda with scene URLs                           │
└───────────────┬──────────────────────────────────────────────┘
                │ Lambda Invoke (synchronous)
                │ {
                │   "jobId": "xyz",
                │   "clips": [
                │     {"s3Key": "scenes/scene_0_raw.mp4", "duration": 8},
                │     {"s3Key": "scenes/scene_1_raw.mp4", "duration": 8},
                │     ...
                │   ],
                │   "outputKey": "final/final_video.mp4"
                │ }
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    LAMBDA (FFmpeg Merge)                     │
│                                                              │
│  1. Download scenes from S3 to /tmp                         │
│                                                              │
│  2. Generate FFmpeg command:                                 │
│     ffmpeg -i scene_0.mp4 -i scene_1.mp4 ...                │
│     -filter_complex "xfade=fade:d=0.3, acrossfade..."       │
│                                                              │
│  3. Merge with 0.3s crossfade transitions                   │
│     Scene1 ─fade─ Scene2 ─fade─ Scene3 ─fade─ Scene4       │
│                                                              │
│  4. Upload final_video.mp4 to S3                            │
│                                                              │
│  5. Return final S3 URL                                     │
└───────────────┬──────────────────────────────────────────────┘
                │ JSON Response
                ▼
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS API (completes)                   │
│                                                              │
│  7. Save final_video_url in database                        │
│  8. Update job status to "DONE"                             │
│  9. Return URL to user                                      │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                      USER BROWSER                            │
│                                                              │
│  Sees Final Video (looks like ONE continuous shot)          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │   🎬 Your video is ready!                              │ │
│  │                                                        │ │
│  │   Duration: 30 seconds                                 │ │
│  │   Scenes: 4 (merged seamlessly)                       │ │
│  │                                                        │ │
│  │   [▶️ Play] [⬇️ Download]                             │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Scene Configuration by Duration

| Duration | Scene Count | Scene Lengths | Structure |
|----------|-------------|---------------|-----------|
| **15s** | 2 scenes | 8s + 8s (trim) | Hook + Product Showcase |
| **30s** | 4 scenes | 8s + 8s + 8s + 6s | Hook + Problem + Solution + CTA |
| **45s** | 5 scenes | 8s + 8s + 8s + 8s + 8s | Hook + Problem + Solution Demo + Benefits + CTA |

---

## 🔄 Job Status State Machine

```
CREATED
    │
    ▼
GENERATING_IMAGE  →  (Nano Banana generates reference image)
    │
    ▼
IMAGE_READY
    │
    ▼
PLANNED  →  (Gemini generates script & scene breakdown)
    │
    ▼
SCENES_GENERATING  →  (Replicate generates each scene video)
    │                   [Scene 1] → [Scene 2] → [Scene 3] → ...
    ▼
SCENES_READY  →  (All scenes uploaded to S3)
    │
    ▼
STITCHING  →  (Lambda merges with FFmpeg)
    │
    ▼
DONE  →  Final video URL available!
    
(Any step can fail)
    ▼
FAILED  →  Error message stored
```

---

## 🗄️ S3 Storage Layout

```
video-jobs/
└── {jobId}/
    ├── reference/
    │   └── reference.png          ← Avatar + Product image
    │
    ├── scenes/
    │   ├── scene_0_raw.mp4        ← Scene 1 from Veo
    │   ├── scene_1_raw.mp4        ← Scene 2 from Veo
    │   ├── scene_2_raw.mp4        ← Scene 3 from Veo
    │   └── scene_3_raw.mp4        ← Scene 4 from Veo
    │
    └── final/
        └── final_video.mp4        ← Merged final video
```

---

## 🎭 Consistency Features

### Same Avatar Across All Scenes

```
Reference Image (generated once)
       │
       ├──→ Scene 1: Uses reference image
       ├──→ Scene 2: Uses SAME reference image
       ├──→ Scene 3: Uses SAME reference image
       └──→ Scene 4: Uses SAME reference image
```

### Seamless Transitions

- **Crossfade duration**: 0.3 seconds
- **Audio crossfade**: Smooth blend between scenes
- **Result**: Looks like ONE continuous video

---

## 📡 API Endpoints

### Create Job
```
POST /api/manual-video/create
{
  "productName": "Amazing Product",
  "productDescription": "Description here...",
  "targetLength": "30",  // "15" | "30" | "45"
  "platform": "tiktok",
  "avatarDescription": "Friendly person",
  "backgroundDescription": "Modern living room"
}

Response: { success: true, jobId: "uuid-here" }
```

### Generate Video
```
POST /api/manual-video/generate
{
  "jobId": "uuid-from-create"
}

Response: {
  success: true,
  finalVideoUrl: "https://s3.../final_video.mp4",
  plan: {
    fullScript: "Complete script...",
    sceneCount: 4,
    totalDuration: 30
  }
}
```

### Check Status
```
GET /api/manual-video/status?jobId=uuid

Response: {
  status: "SCENES_GENERATING",
  sceneCount: 4,
  completedScenes: 2,
  progress: 50
}
```

---

## ⏱️ Timeline (30-second video with 4 scenes)

```
0:00              1:00              5:00              8:00              10:00
  │                 │                 │                 │                 │
  ├─────────────────┴─────────────────┴─────────────────┴─────────────────┤
  │                                                                        │
  │  ┌─────────┐                                                           │
  │  │Reference│ ~30 sec (Nano Banana)                                     │
  │  │ Image   │                                                           │
  │  └─────────┘                                                           │
  │        ┌──────────┐                                                    │
  │        │  Script  │ ~10 sec (Gemini)                                   │
  │        │ Planning │                                                    │
  │        └──────────┘                                                    │
  │                  ┌─────────────────────────────────────────────────────┤
  │                  │      VEO GENERATION (Replicate)                     │
  │                  │      ~5-8 minutes for 4 scenes                      │
  │                  │                                                     │
  │                  │  Scene 1 (8s): ████████████████                    │
  │                  │  Scene 2 (8s): ████████████████                    │
  │                  │  Scene 3 (8s): ████████████████                    │
  │                  │  Scene 4 (6s): ████████████                        │
  │                  └─────────────────────────────────────────────────────┤
  │                                                        ┌───────────────┤
  │                                                        │ Lambda FFmpeg │
  │                                                        │ (~1-2 min)    │
  │                                                        └───────────────┤
  │                                                                    ┌───┤
  │                                                                    │ ✓ │
  └────────────────────────────────────────────────────────────────────┴───┘
                                                                      DONE!
                                                                   ~8-12 min
```

---

## 🔑 Environment Variables

```env
# Replicate API (Veo-3-fast)
REPLICATE_API_KEY=r8_your_token

# Lambda Configuration
LAMBDA_MERGER_FUNCTION_NAME=video-merger

# AWS (for S3 and Lambda)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket

# AI Services
NANO_BANANA_API_KEY=nb_...
GEMINI_API_KEY=...
```

---

## 📁 Project Structure

```
vidholdify/
├── app/api/manual-video/
│   ├── create/route.ts        # Create job with duration
│   ├── generate/route.ts      # Full generation pipeline
│   ├── status/route.ts        # Check job status
│   ├── list/route.ts          # List user's videos
│   └── upload/route.ts        # Upload images
│
├── configs/ai-services/
│   ├── script-planner.ts      # Dynamic scene generation
│   ├── replicate-veo.ts       # Veo-3-fast integration
│   ├── lambda-merger.ts       # Lambda invocation
│   └── nano-banana.ts         # Reference image
│
├── lambda/video-merger/
│   ├── index.ts               # Lambda function
│   ├── package.json
│   └── DEPLOYMENT.md
│
└── configs/
    ├── s3.ts                  # S3 utilities
    └── schema.ts              # Database schema
```
