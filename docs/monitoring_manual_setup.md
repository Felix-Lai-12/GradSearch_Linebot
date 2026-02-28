# 手動設定 GCP 監控告警

由於 gcloud CLI 指令執行緩慢，建議直接在 GCP Console 手動設定。

## 快速設定步驟

### 1. 前往 GCP Monitoring
https://console.cloud.google.com/monitoring/alerting?project=ai-pro-plan

### 2. 建立通知頻道
1. 點選左側 "Notification channels"
2. 點選 "Add new" → Email
3. 輸入: s10355186@gmail.com
4. 儲存並確認 email

### 3. 建立告警政策

#### 告警 1: 高錯誤率
1. 點選 "Create Policy"
2. 設定條件:
   - Resource type: Cloud Function
   - Metric: `cloudfunctions.googleapis.com/function/execution_count`
   - Filter: `status="error"` AND `function_name="gradsearch-linebot"`
   - Threshold: > 10
   - Duration: 5 minutes
3. 通知: 選擇你的 email
4. 名稱: "GradSearch - High Error Rate"

#### 告警 2: 流量異常
1. 點選 "Create Policy"
2. 設定條件:
   - Resource type: Cloud Function
   - Metric: `cloudfunctions.googleapis.com/function/execution_count`
   - Filter: `function_name="gradsearch-linebot"`
   - Threshold: > 100
   - Duration: 1 minute
3. 通知: 選擇你的 email
4. 名稱: "GradSearch - Traffic Spike"

#### 告警 3: 記憶體過高
1. 點選 "Create Policy"
2. 設定條件:
   - Resource type: Cloud Function
   - Metric: `cloudfunctions.googleapis.com/function/user_memory_bytes`
   - Filter: `function_name="gradsearch-linebot"`
   - Threshold: > 80% of allocated memory
   - Duration: 5 minutes
3. 通知: 選擇你的 email
4. 名稱: "GradSearch - High Memory"

#### 告警 4: 執行緩慢
1. 點選 "Create Policy"
2. 設定條件:
   - Resource type: Cloud Function
   - Metric: `cloudfunctions.googleapis.com/function/execution_times`
   - Filter: `function_name="gradsearch-linebot"`
   - Aggregation: 95th percentile
   - Threshold: > 30000 ms
   - Duration: 1 minute
3. 通知: 選擇你的 email
4. 名稱: "GradSearch - Slow Execution"

## 或使用簡化的 REST API

如果想用程式化方式，可以用 curl 直接呼叫 Monitoring API，但需要先取得 access token。

## 驗證設定

設定完成後：
1. 檢查 email 收到驗證信
2. 前往 https://console.cloud.google.com/monitoring/alerting?project=ai-pro-plan
3. 確認 4 個告警政策都已建立

## 測試告警

可以故意觸發錯誤來測試：
```bash
# 發送無效請求到 webhook
curl -X POST https://your-function-url/webhook \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

重複 15 次應該會觸發「高錯誤率」告警。
