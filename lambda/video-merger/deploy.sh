#!/bin/bash
# ==============================================
# Lambda Video Merger - Deployment Script
# ==============================================
# This script deploys the FFmpeg video merger Lambda function to AWS.
# Prerequisites: AWS CLI configured with appropriate permissions
# ==============================================

set -e

# Change to script directory
cd "$(dirname "$0")"

# Configuration
FUNCTION_NAME="video-merger"
ROLE_NAME="video-merger-lambda-role"
REGION="us-east-1"
# Public FFmpeg Layer for us-east-1 (contains ffmpeg binary)
FFMPEG_LAYER_ARN="arn:aws:lambda:us-east-1:764866452798:layer:ffmpeg:1"

echo "=============================================="
echo "🎬 Lambda Video Merger Deployment"
echo "=============================================="
echo "Function: $FUNCTION_NAME"
echo "Region:   $REGION"
echo "=============================================="

# ==============================================
# Step 1: Build the deployment package
# ==============================================
echo ""
echo "📦 Step 1: Building deployment package..."
npm install --silent
npm run build --silent
npm run package --silent
echo "   ✓ Package built: function.zip"

# ==============================================
# Step 2: Create IAM Role (if not exists)
# ==============================================
echo ""
echo "👤 Step 2: Setting up IAM Role..."

if aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1; then
    echo "   ✓ Role already exists: $ROLE_NAME"
else
    echo "   Creating new role..."
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }' > /dev/null

    echo "   Attaching S3 policy..."
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

    echo "   Attaching CloudWatch Logs policy..."
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    echo "   ⏳ Waiting 10s for IAM role propagation..."
    sleep 10
    echo "   ✓ Role created: $ROLE_NAME"
fi

# Get Role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "   Role ARN: $ROLE_ARN"

# ==============================================
# Step 3: Deploy Lambda Function
# ==============================================
echo ""
echo "🚀 Step 3: Deploying Lambda Function..."

if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
    echo "   Function exists. Updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip > /dev/null

    echo "   Waiting for update to complete..."
    aws lambda wait function-updated --function-name $FUNCTION_NAME

    echo "   Updating configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 300 \
        --memory-size 2048 \
        --layers $FFMPEG_LAYER_ARN \
        --environment "Variables={FFMPEG_PATH=/opt/bin/ffmpeg}" > /dev/null

    echo "   ✓ Function updated!"
else
    echo "   Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --handler index.handler \
        --role $ROLE_ARN \
        --zip-file fileb://function.zip \
        --timeout 300 \
        --memory-size 2048 \
        --layers $FFMPEG_LAYER_ARN \
        --environment "Variables={FFMPEG_PATH=/opt/bin/ffmpeg}" > /dev/null

    echo "   ✓ Function created!"
fi

# ==============================================
# Step 4: Verify Deployment
# ==============================================
echo ""
echo "🔍 Step 4: Verifying deployment..."
FUNC_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text)
echo "   Function ARN: $FUNC_ARN"

# ==============================================
# Done!
# ==============================================
echo ""
echo "=============================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Add this to your .env.local:"
echo ""
echo "   LAMBDA_MERGER_FUNCTION_NAME=$FUNCTION_NAME"
echo ""
echo "2. Make sure you also have these AWS variables set:"
echo ""
echo "   AWS_ACCESS_KEY_ID=your_access_key"
echo "   AWS_SECRET_ACCESS_KEY=your_secret_key"
echo "   AWS_REGION=$REGION"
echo "   AWS_S3_BUCKET_NAME=your_bucket_name"
echo ""
echo "=============================================="
