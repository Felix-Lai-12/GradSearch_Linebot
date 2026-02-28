# GradSearch LINE Bot (MVP+) 🎓

這是一個基於 LINE Bot 的台灣研究所查詢系統。除了提供精確的校系資料查詢外，更整合了 Gemini AI 升學顧問，幫助使用者在探索階段獲得個人化推薦。

## 🌟 重點功能

### 1. 🔍 直接查詢特定系所 (Search Mode)
- **精確搜尋**：支援全台 70+ 所大專院校的模糊比對與別名（如輸入「台大資工」、「中央企管」）。
- **完整資訊**：即時顯示 115 學年度推甄時程、招生名額、簡章連結、QS 世界排名、系所簡介、研究領域及師資連結。
- **最新簡章**：整合各大校系官網與 Google Drive 備份之 115 學年度最新簡章 URL。

### 2. 💬 AI 智慧升學顧問 (AI Chat Mode)
- **個人化推薦**：整合 **Google Gemini 2.5 Flash** 模型。當使用者資訊不足時，AI 會模擬真人顧問進行追問引導；當背景明確時，將推薦 3 個最適合的研究所並給予推薦理由。
- **對話式互動**：支援自然語言對話，使用者可針對錄取難度、就業前景、科系特色進行初步諮詢。
- **Loading 動畫**：AI 生成過程中會自動顯示「思考中...」狀態，提升使用者體驗。

### 3. ⚖️ 用戶額度與狀態管理
- **分層額度 (Quota System)**：內建 Tier 系統，免費用戶每日擁有 10 次 AI 諮詢額度，自動每 24 小時重置。
- **模式切換**：使用者可透過選單或指令流暢切換「查詢模式」與「聊天模式」。

### 4. ⌨️ 快捷指令支援
- `/search`：切換至「直接查詢」模式。
- `/chat`：進入「AI 智慧推薦」模式。
- `/wish [內容]`：向開發團隊提出功能建議。
- `/bug [內容]`：回報資訊錯誤或系統問題。
- `幫助` / `說明`：重傳功能導覽選單。

## 🛠 技術架構

- **Language**: TypeScript (Node.js + Express)
- **Deployment**: Google Cloud Functions (2nd Gen) + GitHub Actions CI/CD
- **LLM**: Google Gemini API (2.5-flash / 2.0-fallback)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Media Support**: LINE Flex Message (Carousel, Bubble)
- **Data Scraping**: Firecrawl (AI Scraping) + scripts for 115 batch updates

## 📂 專案結構

- `/src/webhook`: 核心 Webhook 事件處理與狀態分流邏輯。
- `/src/services`: 關鍵業務模型（AI 模型調用、搜尋演算法、配額檢查、狀態管理）。
- `/src/templates`: 各式 LINE Flex Message 模板（搜尋結果、AI 推薦結果、歡迎畫面）。
- `/src/db/migrations`: 資料庫 Schema 演進（包含 user_quotas, user_states, school_aliases 等）。
- `/scripts`: 資料維護與豐富化工具（115 學年度簡章更新、QS 排名同步）。

## 🚀 快速開始

### 1. 環境設定
1. 複製 `.env.example` 到 `.env` 並填入：
   - `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET`
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
2. 執行 `npm install`。

### 2. 部署
專案已內建部署腳本與自動化流水線：
```bash
bash deploy.sh
```
或通過 Push 到 `main` 分支自動觸發 GitHub Actions 部署。

## 📅 開發進度

- [x] Phase 1~2: 基礎架構與關鍵字查詢
- [x] Phase 3: 資料豐富化（115 學年度時程與簡章連結）
- [x] Phase 4: 基本收藏功能 (Backend)
- [x] Phase 5: AI 推薦功能 (Gemini 整合)
- [x] Phase 5.1: 對話引導邏輯與 UX 優化
- [ ] Phase 6: UX 介面篩選排序、進階個人化推播 (Upcoming)

## 🤝 貢獻者與授權

[MIT License](LICENSE)
