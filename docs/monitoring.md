# GradSearch Monitoring & Alerts

## 監控指標

GradSearch 使用 Google Cloud Monitoring 追蹤以下指標：

### 1. 錯誤率告警
- **觸發條件**: 5 分鐘內超過 10 個錯誤
- **嚴重性**: 高
- **處理**: 立即檢查 Cloud Functions 日誌

### 2. 流量異常告警
- **觸發條件**: 1 分鐘內超過 100 個請求
- **嚴重性**: 中
- **可能原因**: 
  - DDoS 攻擊
  - 病毒式傳播
  - Bot 攻擊

### 3. 記憶體使用告警
- **觸發條件**: 記憶體使用率 > 80%
- **嚴重性**: 中
- **處理**: 考慮增加 Cloud Functions 記憶體配置

### 4. 執行時間告警
- **觸發條件**: 95th percentile 執行時間 > 30 秒
- **嚴重性**: 中
- **可能原因**:
  - Gemini API 超時
  - Supabase 查詢慢
  - 網路問題

## 設定告警

### 初次設定

1. 編輯 `scripts/setup_monitoring.sh`，更新你的 email：
   ```bash
   NOTIFICATION_EMAIL="your-email@example.com"
   ```

2. 執行腳本：
   ```bash
   bash scripts/setup_monitoring.sh
   ```

3. 確認 email 收到驗證信並點擊確認

### 查看告警

- **GCP Console**: https://console.cloud.google.com/monitoring/alerting?project=ai-pro-plan
- **Email**: 告警會自動發送到設定的 email

## 日常監控

### 查看即時日誌
```bash
gcloud functions logs read gradsearch-linebot \
  --project=ai-pro-plan \
  --region=asia-east1 \
  --limit=50
```

### 查看錯誤日誌
```bash
gcloud functions logs read gradsearch-linebot \
  --project=ai-pro-plan \
  --region=asia-east1 \
  --filter="severity>=ERROR" \
  --limit=20
```

### 查看特定時間範圍
```bash
gcloud functions logs read gradsearch-linebot \
  --project=ai-pro-plan \
  --region=asia-east1 \
  --start-time="2026-02-28T10:00:00Z" \
  --end-time="2026-02-28T12:00:00Z"
```

## 成本監控

### 設定預算告警

1. 前往 GCP Console > Billing > Budgets
2. 建立預算：
   - 名稱: GradSearch Monthly Budget
   - 金額: $50 (或你的預算)
   - 告警閾值: 50%, 80%, 100%

### 查看當月費用
```bash
gcloud billing accounts list
gcloud billing projects describe ai-pro-plan
```

## 效能基準

### 正常指標
- **平均回應時間**: < 3 秒
- **錯誤率**: < 1%
- **記憶體使用**: < 60%
- **每日請求數**: 100-500

### 異常指標
- **回應時間 > 10 秒**: 檢查 API 延遲
- **錯誤率 > 5%**: 檢查程式碼或外部服務
- **記憶體 > 80%**: 可能有記憶體洩漏
- **請求數突增 10 倍**: 可能是攻擊

## 緊急應變

### 如果遭受 DDoS
1. 暫時停用 Cloud Function
2. 啟用 Cloud Armor (需額外費用)
3. 聯絡 GCP 支援

### 如果 API 配額耗盡
1. Gemini API: 檢查是否有異常大量呼叫
2. Supabase: 升級方案或優化查詢
3. LINE API: 檢查是否有訊息迴圈

### 如果資料庫異常
1. 檢查 Supabase 狀態頁面
2. 查看 Supabase 日誌
3. 考慮啟用 read replica

## 定期檢查清單

### 每週
- [ ] 檢查錯誤日誌
- [ ] 查看流量趨勢
- [ ] 確認告警正常運作

### 每月
- [ ] 檢視成本報告
- [ ] 分析使用者行為
- [ ] 更新監控閾值（如果需要）
- [ ] 輪換 API tokens（建議每 3-6 個月）

### 每季
- [ ] 審查安全政策
- [ ] 更新依賴套件
- [ ] 效能優化評估
