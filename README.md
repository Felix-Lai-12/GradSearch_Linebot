# GradSearch 🎓：你的智慧型台灣研究所升學助理 (Beta)

> [!TIP]
> **現在就加入好友開始體驗：[點我加入 GradSearch LINE Bot](https://lin.ee/kzoio6P)**

---

## 🚀 為什麼選擇 GradSearch？

在豐富的台灣研究所資訊中不再迷路！GradSearch 結合了 **即時雲端資料庫** 與 **Gemini AI 智慧建議**，將傳統繁瑣的簡章查詢轉變為像是在跟專業顧問聊天一樣的輕鬆體驗。

我們的使命是：**幫助準備考研的人，以更低成本、更快速的方式找到適合自己的研究所。**

---

## ✨ 核心功能盤點

### 1. 🔍 萬能搜尋模式 (Search Mode)
*   **懂你的搜尋**：支援全台 70+ 所大學的簡稱與別名。輸入「台大資工」、「交大電子」或「NTU CS」，直接命中目標。
*   **115 學年度即時時程**：不再錯過最後期限！直接顯示精確的推甄/考試時程、招生名額、複試對象與備註。
*   **一鍵開啟簡章**：整合各大校系官網與備份連結，讓你秒讀最新簡章。

### 2. 💬 AI 智慧升學顧問 (AI Chat Mode)
*   **RAG 精確推薦**：基於資料庫內容進行檢索增強生成 (Retrieval-Augmented Generation)。AI 不會瞎編網路上不存在的科系，推薦內容均為真實可查的。
*   **連貫對話記憶**：AI 記得你上一句說過的話！你可以先提供背景細節，後續追問建議。
*   **諮詢額度管理**：內建 Quota 系統 (每日 10 次免費諮詢)，確保穩定服務與資源合理分配。

### 3. 🎓 完整功能介紹與幫助
*   `/help`：取得操作快速指南。
*   `/intro`：深入了解 GradSearch 的開發初衷、使命與未來展望。
*   `我的收藏` / `/fav`：管理個人感興趣的系所清單（開發中）。

### 4. 📋 社群回饋機制
*   `/wish`：功能許願，直接與開發團隊連動，讓功能持續進化。
*   `/bug`：即時報錯，共同維護全台研究所資料庫的正確性。

---

## 🛠 技術架構

*   **雲端腦袋**：Google Gemini 2.5 Flash (LLM) + RAG 檢索技術。
*   **強大動脈**：TypeScript (Node.js) + Express 架構，部署於 Google Cloud Functions (2nd Gen)。
*   **資料基石**：Supabase (PostgreSQL) 雲端資料庫，搭配 Firecrawl AI 爬蟲技術。
*   **極速傳遞**：整合 LINE Messaging API，提供精美的 Flex Message 視覺化介面。

---

## 📅 開發里程碑

- [x] **Phase 1~2**：基礎架構、萬能關鍵字查詢系統。
- [x] **Phase 3**：115 學年度全台系所資料庫大補帖。
- [x] **Phase 5.2**：多輪對話歷史紀錄整合。
- [x] **Phase 5.3**：RAG 檢索增強生成（消除 AI 幻覺）。
- [ ] **Phase 6**：UX 介面優化與進階個人化推薦。

---

## 🤝 致謝與參考 (Credits)

本專案在開發過程中深受開源社群啟發，特別感謝以下專案的技術奠基：
- 核心搜尋邏輯與資料結構設計參考：[jschang19/dp_search_linebot_v2](https://github.com/jschang19/dp_search_linebot_v2) 

---

## 📄 授權

[MIT License](LICENSE)

---

**立即開啟你的升學新紀元：[GradSearch LINE Bot](https://lin.ee/kzoio6P)**  
**科系資料來源：[ReallyGood](https://reallygood.tw/graduate-school-application-guide/)**
