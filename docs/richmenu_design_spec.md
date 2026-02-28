# GradSearch Rich Menu 設計規格

## 圖片尺寸
- **寬度**: 2500 px
- **高度**: 843 px
- **格式**: PNG 或 JPG
- **大小**: < 1 MB

## 佈局（1x3 橫向三格）

```
┌──────────────────┬──────────────────┬──────────────────┐
│                  │                  │                  │
│   🔍 搜尋系所     │   💬 AI 推薦      │   ❓ 使用說明     │
│                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘
   833px wide        834px wide        833px wide
```

## 每個區域內容

### 左側（0-833px）
- **圖示**: 🔍
- **文字**: 搜尋系所
- **顏色建議**: #4A90E2（藍色）

### 中間（833-1667px）
- **圖示**: 💬
- **文字**: AI 推薦
- **顏色建議**: #7B68EE（紫色）

### 右側（1667-2500px）
- **圖示**: ❓
- **文字**: 使用說明
- **顏色建議**: #50C878（綠色）

## 設計工具選項

### 選項 1：LINE Rich Menu 線上工具（最簡單）
1. 前往：https://developers.line.biz/console/
2. 選擇你的 Bot
3. 點選「Rich menus」
4. 使用內建編輯器設計

### 選項 2：Canva（推薦）
1. 建立自訂尺寸：2500 x 843 px
2. 使用範本：https://www.canva.com/
3. 搜尋「LINE Rich Menu」範本

### 選項 3：Figma
1. 建立 Frame：2500 x 843 px
2. 分成 3 等份
3. 加入圖示和文字

## 設計注意事項
- 字體要夠大（建議 80-120 px）
- 圖示要清楚（建議 150-200 px）
- 背景色要跟文字有對比
- 每個區域之間可以加分隔線

## 快速生成（使用 AI）
你可以用以下 prompt 請 AI 生成：

"Create a LINE Rich Menu image, 2500x843 pixels, divided into 3 equal sections:
- Left: Blue background, magnifying glass icon, text '搜尋系所'
- Middle: Purple background, chat bubble icon, text 'AI 推薦'  
- Right: Green background, question mark icon, text '使用說明'
Modern, clean design with clear icons and text."
