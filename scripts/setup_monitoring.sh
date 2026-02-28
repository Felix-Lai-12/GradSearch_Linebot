#!/bin/bash
# Setup GCP monitoring alerts for GradSearch LINE Bot

set -e

PROJECT_ID="ai-pro-plan"
FUNCTION_NAME="gradsearch-linebot"
REGION="asia-east1"
NOTIFICATION_EMAIL="s10355186@gmail.com"

echo "📊 Setting up GCP monitoring alerts..."

# Create notification channel (email)
echo "Creating notification channel..."
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="GradSearch Alerts" \
  --type=email \
  --channel-labels=email_address=$NOTIFICATION_EMAIL \
  --project=$PROJECT_ID \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$CHANNEL_ID" ]; then
  echo "⚠️  Failed to create notification channel. It may already exist."
  echo "Fetching existing channels..."
  CHANNEL_ID=$(gcloud alpha monitoring channels list \
    --project=$PROJECT_ID \
    --filter="displayName:'GradSearch Alerts'" \
    --format="value(name)" \
    --limit=1)
fi

echo "Notification channel: $CHANNEL_ID"

# Alert 1: High error rate (>10 errors in 5 minutes)
echo ""
echo "Creating alert: High error rate..."
gcloud alpha monitoring policies create \
  --project=$PROJECT_ID \
  --notification-channels=$CHANNEL_ID \
  --display-name="GradSearch - High Error Rate" \
  --condition-display-name="Error rate > 10 in 5 min" \
  --condition-threshold-value=10 \
  --condition-threshold-duration=300s \
  --condition-filter="resource.type=\"cloud_function\" AND resource.labels.function_name=\"$FUNCTION_NAME\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\" AND metric.labels.status=\"error\"" \
  --aggregation-alignment-period=300s \
  --aggregation-per-series-aligner=ALIGN_RATE \
  --aggregation-cross-series-reducer=REDUCE_SUM \
  --documentation="High error rate detected in GradSearch bot. Check logs immediately." \
  2>/dev/null || echo "⚠️  Alert may already exist"

# Alert 2: Abnormal traffic spike (>100 requests in 1 minute)
echo ""
echo "Creating alert: Traffic spike..."
gcloud alpha monitoring policies create \
  --project=$PROJECT_ID \
  --notification-channels=$CHANNEL_ID \
  --display-name="GradSearch - Traffic Spike" \
  --condition-display-name="Requests > 100 in 1 min" \
  --condition-threshold-value=100 \
  --condition-threshold-duration=60s \
  --condition-filter="resource.type=\"cloud_function\" AND resource.labels.function_name=\"$FUNCTION_NAME\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\"" \
  --aggregation-alignment-period=60s \
  --aggregation-per-series-aligner=ALIGN_RATE \
  --aggregation-cross-series-reducer=REDUCE_SUM \
  --documentation="Abnormal traffic spike detected. Possible DDoS or viral growth." \
  2>/dev/null || echo "⚠️  Alert may already exist"

# Alert 3: High memory usage (>80%)
echo ""
echo "Creating alert: High memory usage..."
gcloud alpha monitoring policies create \
  --project=$PROJECT_ID \
  --notification-channels=$CHANNEL_ID \
  --display-name="GradSearch - High Memory Usage" \
  --condition-display-name="Memory > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s \
  --condition-filter="resource.type=\"cloud_function\" AND resource.labels.function_name=\"$FUNCTION_NAME\" AND metric.type=\"cloudfunctions.googleapis.com/function/user_memory_bytes\"" \
  --aggregation-alignment-period=60s \
  --aggregation-per-series-aligner=ALIGN_MEAN \
  --documentation="Memory usage is high. Consider increasing function memory allocation." \
  2>/dev/null || echo "⚠️  Alert may already exist"

# Alert 4: Function execution time >30s
echo ""
echo "Creating alert: Slow execution..."
gcloud alpha monitoring policies create \
  --project=$PROJECT_ID \
  --notification-channels=$CHANNEL_ID \
  --display-name="GradSearch - Slow Execution" \
  --condition-display-name="Execution time > 30s" \
  --condition-threshold-value=30000 \
  --condition-threshold-duration=60s \
  --condition-filter="resource.type=\"cloud_function\" AND resource.labels.function_name=\"$FUNCTION_NAME\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_times\"" \
  --aggregation-alignment-period=60s \
  --aggregation-per-series-aligner=ALIGN_DELTA \
  --aggregation-cross-series-reducer=REDUCE_PERCENTILE_95 \
  --documentation="Function execution is slow. Check for API timeouts or database issues." \
  2>/dev/null || echo "⚠️  Alert may already exist"

echo ""
echo "✅ Monitoring alerts configured!"
echo ""
echo "📋 Alerts created:"
echo "  1. High Error Rate (>10 errors in 5 min)"
echo "  2. Traffic Spike (>100 requests in 1 min)"
echo "  3. High Memory Usage (>80%)"
echo "  4. Slow Execution (>30s)"
echo ""
echo "🔔 Notifications will be sent to: $NOTIFICATION_EMAIL"
echo ""
echo "View alerts at:"
echo "https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
