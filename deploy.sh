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
  --set-env-vars="NODE_ENV=production,LINE_CHANNEL_ACCESS_TOKEN=LsK/SAPNVfDj/iDZjgabGIDobK+FBu1jpNrq/WTkTB04r6rePBi0BfLjTGlKq19WTXQCnVEo9dmLpKt1WsXKJFC9tKD+K7PGPI1te7jWREPo5BhMz3+bKqza5ztu9gDEWU4GlHPg9ADL1PeUyFiW+gdB04t89/1O/w1cDnyilFU=,LINE_CHANNEL_SECRET=f915a19f76040c270bea42543ef6310d,SUPABASE_URL=https://doswtaoepsiakxypdepb.supabase.co,SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvc3d0YW9lcHNpYWt4eXBkZXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwODI2NiwiZXhwIjoyMDg3Nzg0MjY2fQ.navA8sDELE-Dds16Gm4eFHWPajNshOTxVfqEWcLZHNI"

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
