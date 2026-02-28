# GradSearch 🎓：你的智慧型台灣研究所升學助理

> [!TIP]
> **現在就加入好友開始體驗：[點我加入 GradSearch LINE Bot](https://lin.ee/kzoio6P)**

---

## 🚀 為什麼選擇 GradSearch？

在豐富的台灣研究所資訊中不再迷路！GradSearch 結合了 **即時雲端資料庫** 與 **Gemini AI 智慧建議**，將傳統繁瑣的簡章查詢轉變為像是在跟專業顧問聊天一樣的輕鬆體驗。

無論你是在尋找特定的資工所報名時程，還是對於「跨考數據科學」感到迷惘，GradSearch 都能為你精準導航。

---

## ✨ 核心亮點

### 🔍 萬能搜尋模式 (Search Mode)
*   **懂你的搜尋**：支援全台 70+ 所大學的簡稱與別名。輸入「台大資工」、「交大電子」或「NTU CS」，直接命中目標。
*   **115 學年度即時時程**：不再錯過最後期限！直接顯示精確的推甄/考試時程、名額與備註。
*   **一鍵開啟簡章**：整合各大校系官網與雲端備份，讓你秒讀最新簡章。

### 💬 AI 智慧升學顧問 (AI Chat Mode)
*   **RAG 精確推薦**：基於我們爬取的真實資料庫進行推薦。AI 不會瞎編網路上不存在的科系，每一筆推薦都是真實可查的。
*   **短期記憶連貫對話**：AI 記得你上一句說過的話！你可以先問「我有國企背景」，接著問「想轉職數據分析有什麼建議？」，AI 會綜合脈絡回應。
*   **分層額度管理**：針對不同需求的用戶提供彈性額度，專業級（Pro）用戶更可享受無限制諮詢。

### 📋 許願與錯誤回報
*   我們非常重視用戶意見！直接輸入 `/wish` 或 `/bug`，即可透過 GitHub API 即時連動開發團隊，讓功能持續進化。

---

## 🛠 技術核心

*   **雲端腦袋**：Google Gemini 2.5 Flash (LLM) + RAG (Retrieval-Augmented Generation) 檢索技術。
*   **強大動脈**：TypeScript (Node.js) + Express 架構，部署於 Google Cloud Functions (2nd Gen)。
*   **資料基石**：Supabase (PostgreSQL) 雲端資料庫，搭配 Firecrawl AI 爬蟲技術。
*   **極速傳遞**：整合 LINE Messaging API，提供精美的 Flex Message 視覺化介面。

---

## 📅 開發里程碑

- [x] **Phase 1~2**：基礎架構、萬能關鍵字查詢系統。
- [x] **Phase 3**：115 學年度全台系所資料庫大補帖。
- [x] **Phase 5.2**：多輪對話歷史紀錄整合。
- [x] **Phase 5.3**：RAG 檢索增強生成（消除 AI 幻覺）。
- [ ] **Phase 6**：UX 介面優化與進階篩選排序。

---

## 🤝 致謝與參考 (Credits)

本專案在開發過程中深受開源社群啟發，特別感謝以下專案的技術奠基：
- 核心搜尋邏輯與資料結構設計參考自：[jschang19/dp_search_linebot_v2](https://github.com/jschang19/dp_search_linebot_v2) 

---

## 📄 授權

[MIT License](LICENSE)

---

**立即開啟你的升學新紀元：[GradSearch LINE Bot](https://lin.ee/kzoio6P)**
