# 🚀 Complete Setup Guide

## Step-by-Step Instructions for Setting Up Vidholdify

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Neon database account (or any PostgreSQL)
- [ ] Replicate account
- [ ] Google AI Studio account (for Gemini)
- [ ] Nano Banana API access

---

## PART 1: Database Setup (Neon PostgreSQL)

### Step 1.1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

### Step 1.2: Push Database Schema

```bash
# From project root
cd /Users/harsh/Documents/GitHub/vidholdify

# Generate migrations
npx drizzle-kit generate

# Push to database (creates tables)
npx drizzle-kit push

echo "✅ Database schema created!"
```

### Step 1.3: Verify Tables Created

The following tables should be created:
- `users` - User accounts
- `video_jobs` - Manual video generation jobs
- `scenes` - Individual scenes for each video
- `topview_tasks` - TopView workflow tracking
- `topview_videos` - TopView video records

---

## PART 2: AWS S3 Setup

### Step 2.1: Create S3 Bucket

```bash
# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1

# Create bucket
aws s3 mb s3://vidholdify-videos-$AWS_ACCOUNT_ID --region $AWS_REGION

# Enable CORS for browser uploads
cat > /tmp/cors.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"]
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket vidholdify-videos-$AWS_ACCOUNT_ID \
    --cors-configuration file:///tmp/cors.json

echo "✅ S3 Bucket created: vidholdify-videos-$AWS_ACCOUNT_ID"
```

### Step 2.2: Create IAM User with Permissions

```bash
# Create policy for video generation
cat > /tmp/video-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3Access",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::vidholdify-videos-*",
                "arn:aws:s3:::vidholdify-videos-*/*"
            ]
        },
        {
            "Sid": "LambdaInvoke",
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": "arn:aws:lambda:*:*:function:video-merger"
        }
    ]
}
EOF

# Create policy
aws iam create-policy \
    --policy-name VidholdifyVideoPolicy \
    --policy-document file:///tmp/video-policy.json

# Create user
aws iam create-user --user-name vidholdify-app

# Attach policy
aws iam attach-user-policy \
    --user-name vidholdify-app \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/VidholdifyVideoPolicy

# Create access keys
aws iam create-access-key --user-name vidholdify-app > /tmp/keys.json

echo "✅ IAM User created!"
echo "⚠️  SAVE THESE KEYS:"
cat /tmp/keys.json | jq '.AccessKey | {AccessKeyId, SecretAccessKey}'
```

---

## PART 3: AWS Lambda Setup (FFmpeg Merger)

### Step 3.1: Create Lambda Function

```bash
# Create execution role
cat > /tmp/lambda-trust.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

aws iam create-role \
    --role-name video-merger-role \
    --assume-role-policy-document file:///tmp/lambda-trust.json

# Add S3 permissions
cat > /tmp/lambda-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::vidholdify-videos-*/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name video-merger-role \
    --policy-name VideoMergerPolicy \
    --policy-document file:///tmp/lambda-policy.json

echo "✅ Lambda Role created!"
```

### Step 3.2: Build and Deploy Lambda

```bash
# Navigate to Lambda directory
cd /Users/harsh/Documents/GitHub/vidholdify/lambda/video-merger

# Install dependencies
npm install

# Build TypeScript
npm run build

# Package for Lambda
npm run package

# Create Lambda function
aws lambda create-function \
    --function-name video-merger \
    --runtime nodejs20.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/video-merger-role \
    --handler dist/index.handler \
    --timeout 300 \
    --memory-size 2048 \
    --zip-file fileb://function.zip \
    --region $AWS_REGION

# Add FFmpeg layer (public layer)
aws lambda update-function-configuration \
    --function-name video-merger \
    --layers arn:aws:lambda:us-east-1:978368660611:layer:ffmpeg:1 \
    --region $AWS_REGION

echo "✅ Lambda function deployed!"
```

---

## PART 4: API Keys Setup

### Step 4.1: Get Replicate API Key

1. Go to [replicate.com](https://replicate.com)
2. Sign up / Sign in
3. Go to https://replicate.com/account/api-tokens
4. Create a new API token
5. Copy the token (starts with `r8_`)

### Step 4.2: Get Gemini API Key

1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Sign in with Google
3. Click "Get API Key" → "Create API Key"
4. Copy the key

### Step 4.3: Get Nano Banana API Key

1. Go to your Nano Banana dashboard
2. Navigate to API settings
3. Copy your API key

---

## PART 5: Environment Variables

### Step 5.1: Create .env.local

Create a file `.env.local` in your project root:

```env
# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# ========================================
# AUTHENTICATION (Clerk)
# ========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# ========================================
# AWS Configuration
# ========================================
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=vidholdify-videos-YOUR_ACCOUNT_ID

# ========================================
# Lambda (FFmpeg Merger)
# ========================================
LAMBDA_MERGER_FUNCTION_NAME=video-merger

# ========================================
# Replicate (Veo Video Generation)
# ========================================
REPLICATE_API_KEY=r8_your_token_here

# ========================================
# Gemini (Script Generation)
# ========================================
GEMINI_API_KEY=your_gemini_api_key

# ========================================
# Nano Banana (Image Generation)
# ========================================
NANO_BANANA_API_KEY=your_nano_banana_key
```

---

## PART 6: Test the Setup

### Step 6.1: Run Database Migration Check

```bash
npx drizzle-kit push --verbose
```

### Step 6.2: Test S3 Connection

```bash
# Test upload
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt s3://$AWS_S3_BUCKET_NAME/test.txt
aws s3 rm s3://$AWS_S3_BUCKET_NAME/test.txt
echo "✅ S3 connection works!"
```

### Step 6.3: Test Lambda Function

```bash
aws lambda invoke \
    --function-name video-merger \
    --payload '{"test": true}' \
    --cli-binary-format raw-in-base64-out \
    /tmp/lambda-response.json

cat /tmp/lambda-response.json
echo "✅ Lambda responds!"
```

### Step 6.4: Start Development Server

```bash
cd /Users/harsh/Documents/GitHub/vidholdify
npm run dev
```

---

## 📊 Architecture Summary

```
User Browser
      │
      ▼
┌──────────────────────────────────────────────────┐
│              Next.js API (Vercel)                │
│                                                   │
│  1. Create Job → /api/manual-video/create        │
│  2. Generate   → /api/manual-video/generate      │
│     ├── Nano Banana (Reference Image)            │
│     ├── Gemini (Script Plan)                     │
│     ├── Replicate (Veo-3-fast Video)             │
│     └── Lambda (FFmpeg Merge)                    │
│  3. Status     → /api/manual-video/status        │
│                                                   │
└──────────────────────────────────────────────────┘
      │                    │
      ▼                    ▼
┌───────────┐      ┌───────────────┐
│   Neon    │      │     AWS S3    │
│ PostgreSQL│      │ (Videos/Images)│
└───────────┘      └───────────────┘
```

---

## ✅ Final Checklist

- [ ] Database URL configured and tables created
- [ ] S3 bucket created with CORS
- [ ] IAM user with proper permissions
- [ ] Lambda function deployed with FFmpeg layer
- [ ] Replicate API key added
- [ ] Gemini API key added
- [ ] Nano Banana API key added
- [ ] Clerk authentication configured
- [ ] `.env.local` file created with all variables

---

## 🎉 Ready to Test!

Once everything is configured:

1. Go to `http://localhost:3000/dashboard/manual-video`
2. Fill in the form:
   - Choose an avatar
   - Add product name and description
   - Select background
   - Choose duration (15s, 30s, or 45s)
3. Click "Generate Video"
4. Watch the progress!

---

## 💰 Estimated Costs

| Service | Cost |
|---------|------|
| Neon (Free tier) | $0 |
| AWS S3 (10GB) | ~$0.25/month |
| AWS Lambda | ~$0.10/1000 invocations |
| Replicate (Veo-3-fast) | ~$0.50/video |
| Gemini | Free tier available |

---

## 🔧 Troubleshooting

### Lambda "Task timed out"
- Increase Lambda timeout to 300s
- Increase memory to 2048MB

### S3 "Access Denied"
- Check IAM permissions
- Verify bucket name matches

### Replicate "Invalid API key"
- Ensure key starts with `r8_`
- Check for extra spaces

### Database connection fails
- Verify DATABASE_URL format
- Check Neon dashboard for connection string
