# GradSearch 🎓：你的智慧型台灣研究所升學助理 (Beta)

> [!TIP]
> **現在就加入好友開始體驗：[點我加入 GradSearch LINE Bot](https://lin.ee/kzoio6P)**

---

## 🚀 為什麼選擇 GradSearch？

在豐富的台灣研究所資訊中不再迷路！GradSearch 結合了 **系統化研究所資料庫** 與 **Gemini AI 智慧建議**，將傳統繁瑣的簡章查詢轉變為像是在跟專業顧問聊天一樣的輕鬆體驗。

我們的使命是：**幫助準備考研的人，以更低成本、更快速的方式找到適合自己的研究所。**

> [!WARNING]
```markdown
```markdown
> **重要聲明**：本服務目前收錄之時程與招生數據為 **115 學年度** 之資訊，供未來申請者作為往年趨勢參考，並將於下屆招生開始時更新。實際申請請務必以各校當年度官方公告為準。
```
```

---

## ✨ 核心功能盤點

### 1. 🔍 搜尋模式 (Search Mode)
```markdown
*   **懂你的搜尋**：支援全台 140+ 所大學的簡稱與別名。輸入「台大資工」、「交大電子」或「NTU CS」，直接命中目標。
```
```markdown
*   **116 考生先行準備**：顯示 115 學年度之推甄/考試時程、招生名額、複試對象與備註，幫助建立申請進度感。
```
*   **一鍵開啟簡章**：整合各大校系官網與備份連結，提供快速查閱歷年簡章之便利性。

### 2. 💬 AI 推薦 (AI Chat Mode)
*   **RAG 精確推薦**：基於資料庫內容進行檢索增強生成 (Retrieval-Augmented Generation)。AI 嚴格根據資料庫內真實系所進行推薦，避免資訊幻覺。
*   **連貫對話記憶**：AI 具備短期對話記憶，您可以先提供個人背景（如：私立商管系），再接著請 AI 根據該背景提供建議。
*   **諮詢額度管理**：內建 Quota 系統 (每日提供 10 次免費諮詢)，確保系統穩定運作。

### 3. 📋 社群回饋機制
*   `/help`：取得操作快速指南。
*   `/intro`：深入了解 GradSearch 的開發初衷、使命與未來展望。
*   `/wish`：功能許願，直接與開發團隊連動，讓功能持續進化。
*   `/bug`：即時報錯並觸發 **AI Auto-Healing (自動修復)** 機制！Gemini 會即時分析您的回報，自動修正錯誤網址或補上遺漏的搜尋縮寫（如：NTU 中文 / Ntu 中文）。
---

## 🛠 技術架構

*   **模型技術 (LLM)**：Google Gemini 2.5 Flash API，採用 RAG 檢索架構確保輸出準確性。
*   **前後端架構**：TypeScript (Node.js) + Express，部署於 Google Cloud Functions (2nd Gen) 無伺服器環境。
*   **資料庫系統**：Supabase (PostgreSQL)，整合 Firecrawl AI 進行非同步資料爬取與結構化處理。
*   **通訊介面**：LINE Messaging API，搭配 Flex Message 提供視覺化互動 UI。

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
