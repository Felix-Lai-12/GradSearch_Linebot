#!/bin/bash
# Deploy GradSearch LINE Bot to Google Cloud Functions 2nd Gen
# Prerequisites: gcloud CLI installed and authenticated

set -e

PROJECT_ID="ai-pro-plan"
FUNCTION_NAME="gradsearch-linebot"
REGION="asia-east1"

echo "📦 Building TypeScript..."
npm run build

echo ""
echo "🚀 Deploying to Cloud Functions 2nd Gen..."
gcloud functions deploy $FUNCTION_NAME \
  --project=$PROJECT_ID \
  --gen2 \
  --runtime=nodejs24 \
  --region=$REGION \
  --source=. \
  --min-instances=1 \
  --max-instances=5 \
  --entry-point=handleRequest \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,LINE_CHANNEL_ACCESS_TOKEN=${LINE_CHANNEL_ACCESS_TOKEN},LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET},SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY},GH_ISSUES_TOKEN=${GH_ISSUES_TOKEN}"

echo ""
echo "✅ Deployed!"
echo ""
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --project=$PROJECT_ID --region=$REGION --gen2 --format='value(serviceConfig.uri)' 2>/dev/null || echo "")

if [ -n "$FUNCTION_URL" ]; then
  echo "🔗 Webhook URL: ${FUNCTION_URL}/webhook"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Go to LINE Developers Console"
  echo "   2. Set Webhook URL to: ${FUNCTION_URL}/webhook"
  echo "   3. Enable 'Use webhook'"
  echo "   4. Disable 'Auto-reply messages'"
else
  echo "⚠️ Could not get function URL. Check the GCP Console."
fi
