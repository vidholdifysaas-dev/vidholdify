#!/bin/bash

# Lambda v6 Deployment Script
# Deploys the new silence-detection enabled video merger

set -e

echo "============================================"
echo "🚀 Lambda Video Merger v6 Deployment"
echo "============================================"

# Configuration
FUNCTION_NAME="${LAMBDA_MERGER_FUNCTION_NAME:-video-merger}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LAMBDA_DIR="$PROJECT_DIR/lambda/video-merger"
DOCS_DIR="$PROJECT_DIR/docs"

echo "📂 Project Directory: $PROJECT_DIR"
echo "📂 Lambda Directory: $LAMBDA_DIR"
echo "📂 Docs Directory: $DOCS_DIR"

cd "$LAMBDA_DIR"
echo "📁 Working directory: $(pwd)"

# Step 1: Backup existing code
echo ""
echo "📦 Step 1: Backing up existing code..."
if [ -f "index.ts" ]; then
    cp index.ts "index.ts.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   ✅ Backup created"
else
    echo "   ⚠️  No existing index.ts found"
fi

# Step 2: Copy new Lambda code
echo ""
echo "📋 Step 2: Copying Lambda v6 code..."
cp "$DOCS_DIR/lambda-v6-silence-trim.ts" index.ts
echo "   ✅ Lambda v6 code copied"

# Step 3: Install dependencies
echo ""
echo "📥 Step 3: Installing dependencies..."
npm install --silent
echo "   ✅ Dependencies installed"

# Step 4: Build TypeScript
echo ""
echo "🔨 Step 4: Building TypeScript..."
npm run build
echo "   ✅ Build complete"

# Step 5: Create deployment package
echo ""
echo "📦 Step 5: Creating deployment package..."
rm -f function.zip

# Check if dist folder exists and has index.js
if [ -f "dist/index.js" ]; then
    # Copy the compiled JS to root level (Lambda expects handler at root)
    cp dist/index.js ./index.js
    echo "   📄 Copied dist/index.js to root"
fi

# Create zip with index.js at root level and node_modules
zip -r function.zip index.js node_modules/ -q
echo "   ✅ function.zip created ($(du -h function.zip | cut -f1))"

# Verify the zip structure
echo "   📋 Zip contents:"
unzip -l function.zip | head -10

# Step 6: Deploy to AWS
echo ""
echo "☁️  Step 6: Deploying to AWS Lambda..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://function.zip \
    --region "$AWS_REGION" \
    --output text \
    --query 'FunctionName'
echo "   ✅ Lambda code updated"

# Step 7: Wait for code update to complete
echo ""
echo "⏳ Step 7: Waiting for code update to complete..."
sleep 10
echo "   ✅ Wait complete"

# Step 8: Update configuration and handler
echo ""
echo "⚙️  Step 8: Updating Lambda configuration..."
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --timeout 300 \
    --memory-size 1024 \
    --handler "index.handler" \
    --region "$AWS_REGION" \
    --output text \
    --query 'FunctionName'
echo "   ✅ Lambda configuration updated (handler: index.handler)"

# Done!
echo ""
echo "============================================"
echo "✅ Lambda v6 Deployed Successfully!"
echo "============================================"
echo ""
echo "Function Name: $FUNCTION_NAME"
echo "Region: $AWS_REGION"
echo "Timeout: 300s"
echo "Memory: 1024 MB"
echo ""
echo "New features:"
echo "  • Silence detection at end of each scene"
echo "  • Automatic trimming of non-speaking frames"
echo "  • Seamless video merging"
echo "  • Debug info in response"
echo ""
echo "Test with:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' /tmp/test.json"
echo ""
