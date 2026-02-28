# GradSearch LINE Bot (MVP) 🎓

這是一個基於 LINE Bot 的台灣研究所查詢系統（MVP 版本）。旨在幫助使用者快速查詢台灣大學院校研究所的 QS 排名、所在城市、系所簡介、招生資訊等。

## 功能特點 (Current MVP)

- **校系關鍵字查詢**：支援模糊比對與別名（如輸入「台大資工」可精確找到國立臺灣大學資訊工程學系）。
- **QS 世界排名整合**：即時顯示 2025 年台灣大學院校的最新世界排名。
- **系所資料豐富化**：整合系所官方網站、研究領域與簡單摘要。
- **測試範例顯示**：提供完整的「測試資工」範例，展示包含報名截止日期、備審資料、報名費等詳細資訊。

## 技術架構

- **Backend**: Node.js (TypeScript) + Express
- **Computing**: Google Cloud Functions (2nd Gen)
- **Database**: Supabase (PostgreSQL)
- **Messaging**: LINE Messaging API
- **Data Enrichment**: Firecrawl (AI Scraping) + Python (Parsing)

## 專案結構

- `/src`: 主要程式碼邏輯（Webhook Handler, Search Services, Template Builders）
- `/scripts`: 資料維護與擴充相關腳本（QS 排名更新、系所網站同步、AI 摘要）
- `/src/db/migrations`: 資料庫結構變更 SQL

## 快速開始

### 1. 本地開發
1. 複製 `.env.example` 並更名為 `.env`，填入相關 Key。
2. 執行 `npm install`。
3. 執行 `npm run dev` 啟動開發伺服器。

### 2. 部署到 Google Cloud Functions
使用內建腳本：
```bash
bash deploy.sh
```

## CI/CD 說明

本專案已設定 GitHub Actions 工作流於 `.github/workflows/deploy.yml`。
當程式碼推送到 `main` 分支時，會自動進行編譯並部署至 GCF。
需要在 GitHub Repository 的 `Settings > Secrets and variables > Actions` 中設定以下 Secrets：
- `GCP_SA_KEY`: Google Cloud Service Account 的 JSON 密鑰。
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `FIRECRAWL_API_KEY` (可選)

## 開源授權

[MIT License](LICENSE)
