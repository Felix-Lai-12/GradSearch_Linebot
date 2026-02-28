import { checkAndConsumeQuota } from './quota';
import { GoogleGenAI, Type, Schema, Content } from '@google/genai';
import { getOrInitHistory, appendChatHistory, ChatMessage } from './chat_history';
import { searchProgramsByKeywords } from './search';

// Initialize the API outside so it's ready. If key is missing, throw on first use.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RecommendationResult {
    school_name: string;
    program_name: string;
    reason: string;
}

export interface AiResponse {
    response_type: 'chat' | 'recommendation';
    reply_message: string;
    recommendations?: RecommendationResult[];
    search_keywords?: string[]; // 用於搜尋資料庫的關鍵字
}

const SYSTEM_PROMPT = `
你是一位專業的台灣研究所升學顧問，名叫 GradSearch AI。
你的目標是根據用戶的背景（系所、成績、興趣、未來目標）提供精確的選校與選系建議。

### 運作模式
1. **諮詢階段 (response_type: 'chat')**：
   - 如果用戶提供的資訊不夠充分（例如：只說想考資管），請用親切且專業的口吻詢問細節。
   - 不要急著給推薦，先多了解用戶。
   - **重要限制**：最多詢問 2 次。如果這是用戶的第 3 次訊息，即使資訊不完整，也必須基於現有資訊給出推薦（設定 response_type: 'recommendation'）。
   - **邊界情況處理**：
     * 過於籠統的問題（如「最好的研究所是哪個？」）→ 引導用戶說明領域和背景
     * 超出範圍的問題（如「如何準備考試？」）→ 禮貌說明你專注於選校建議
     * 資訊矛盾（如「我想讀文組但對寫程式有興趣」）→ 詢問確認真實意圖

2. **推薦階段 (response_type: 'recommendation')**：
   - 當你認為掌握足夠資訊時，請在 'search_keywords' 欄位中提供最多 5 個關鍵字。
   - **觸發條件**：
     * 用戶提供了明確的背景和需求
     * 或者這已經是用戶的第 3 次訊息（即使資訊不完整也要給建議）
     * 或者用戶明確要求推薦（如「給我一些建議」）
   - **關鍵字規範**（重要）：
     * 優先使用「系所正式名稱」：資訊工程、企業管理、電機工程
     * 可用「常見縮寫」：資工、資管、電機、機械
     * 可用「學校名稱」：台大、清大、交大、成大、政大
     * 可用「地區」：台北、新竹、台中、台南、高雄
     * 可用「特性」：國立、私立、頂大
     * **避免**：過於模糊的詞（如「好的」、「熱門」）、英文縮寫（除非是 MBA、EMBA）
   - 關鍵字範例：['資訊工程', '台大', '清大', '國立', '台北']

3. **後續對話**：
   - 給出推薦後，根據用戶的回饋決定：
     * 如果用戶想調整條件 → 可以再次推薦（response_type: 'recommendation'）
     * 如果用戶想深入了解某個系所 → 提供更多資訊（response_type: 'chat'）
     * 如果用戶滿意 → 鼓勵他們使用搜尋功能查看詳細簡章

### 推薦理由標準（必須包含以下至少 2 項）
1. **學術聲望**：系所排名、師資陣容、研究領域強項
2. **就業前景**：產業連結、校友網絡、就業率、起薪水準
3. **興趣匹配**：課程內容、研究方向是否符合用戶興趣
4. **地理位置**：是否符合用戶的地區偏好、生活機能
5. **錄取難度**：根據用戶背景評估錄取可能性（保守/適中/挑戰）
6. **特色優勢**：獨特的課程、產學合作、國際交流機會

### Few-shot Examples

**範例 1：第 1 次訊息 - 資訊不足，詢問**
用戶：「我想考資管」
AI 回應：
{
  "response_type": "chat",
  "reply_message": "了解！資管所是很好的選擇。為了給您更精準的建議，可以分享一下：\n\n1. 您目前的背景（大學科系、在校成績）\n2. 未來想從事的領域（數據分析、資訊管理、金融科技等）\n3. 地區偏好（北部/中部/南部）"
}

**範例 2：第 2 次訊息 - 補充資訊，再詢問一次**
用戶：「我是私立資管系，成績中上」
AI 回應：
{
  "response_type": "chat",
  "reply_message": "很好！最後想確認：\n1. 您偏好哪個地區？\n2. 有特別想發展的方向嗎（如數據分析、系統開發）？"
}

**範例 3：第 3 次訊息 - 必須給建議（即使資訊不完整）**
用戶：「台北吧」
AI 回應：
{
  "response_type": "recommendation",
  "reply_message": "根據您的背景（私立資管、成績中上、偏好台北），我來為您搜尋適合的研究所...",
  "search_keywords": ["資訊管理", "台北", "國立", "私立"]
}

**範例 4：過於籠統，但已是第 3 次 - 仍要給建議**
用戶第 1 次：「台灣最好的研究所是哪個？」
AI：「可以先告訴我您想讀哪個領域？」
用戶第 2 次：「理工科」
AI：「理工科範圍很廣，您對哪個領域特別有興趣？」
用戶第 3 次：「都可以」
AI 回應：
{
  "response_type": "recommendation",
  "reply_message": "了解！我先為您推薦幾個台灣頂尖的理工研究所...",
  "search_keywords": ["電機", "資工", "機械", "台大", "清大"]
}

### 注意事項
- 請全程使用繁體中文。
- 語氣要像一位溫暖、專業、且有洞察力的生涯諮詢師。
- **嚴格遵守「最多 2 次詢問」規則**：第 3 次訊息必須給出推薦。
- 如果用戶問題超出你的專業範圍（如考試技巧、申請文件撰寫），請禮貌說明你專注於選校建議。
- 保持對話的連貫性，記住用戶之前提供的資訊。
`;

/**
 * 根據使用者的問題，呼叫 Gemini API 取得推薦名單
 */
export async function getRecommendations(userId: string, userMessage: string): Promise<AiResponse | null> {
    // 檢查額度
    const allowed = await checkAndConsumeQuota(userId);
    if (!allowed) {
        throw new Error('QUOTA_EXCEEDED');
    }

    try {
        // 第一選擇模式：gemini-2.5-flash
        return await invokeGeminiRAGFlow('gemini-2.5-flash', userId, userMessage);
    } catch (error: any) {
        console.warn('First model failed, falling back to gemini-2.0-flash:', error.message);
        try {
            // 降級模式
            return await invokeGeminiRAGFlow('gemini-2.0-flash', userId, userMessage);
        } catch (fbError: any) {
            console.error('Fallback model also failed:', fbError.message);
            return null;
        }
    }
}

async function invokeGeminiRAGFlow(modelName: string, userId: string, message: string): Promise<AiResponse> {
    const step1Schema: Schema = {
        type: Type.OBJECT,
        properties: {
            response_type: { type: Type.STRING, enum: ['chat', 'recommendation'] },
            reply_message: { type: Type.STRING },
            search_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["response_type", "reply_message"]
    };

    const recommendationSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            response_type: { type: Type.STRING, enum: ['recommendation'] },
            reply_message: { type: Type.STRING },
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        school_name: { type: Type.STRING },
                        program_name: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ["school_name", "program_name", "reason"]
                }
            }
        },
        required: ["response_type", "reply_message", "recommendations"]
    };

    const { chatHistoryId, messages } = await getOrInitHistory(userId);

    // Step 1: Intent Recognition & Keyword Extraction
    const contents: Content[] = [
        ...messages,
        { role: 'user', parts: [{ text: message }] }
    ];

    const step1Result = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
            systemInstruction: SYSTEM_PROMPT + "\n\n現在請對用戶的輸入進行意圖判定。若要推薦，請務必給予 search_keywords。",
            responseMimeType: 'application/json',
            responseSchema: step1Schema,
        }
    });

    const step1Text = step1Result.text;
    if (!step1Text) throw new Error('Empty response from model in step 1');

    const step1Json = JSON.parse(step1Text) as AiResponse;

    // If it's just chat, or no keywords, return as is
    if (step1Json.response_type === 'chat' || !step1Json.search_keywords || step1Json.search_keywords.length === 0) {
        await appendChatHistory(chatHistoryId, messages, message, step1Text);
        return step1Json;
    }

    // Step 2: Retrieval from Supabase
    console.log(`[RAG] Searching keywords: ${step1Json.search_keywords.join(', ')}`);
    const searchResults = await searchProgramsByKeywords(step1Json.search_keywords);

    if (searchResults.length === 0) {
        // Fallback: If no real data found, treat as chat and tell user we couldn't find exact matches
        const fallbackResponse: AiResponse = {
            response_type: 'chat',
            reply_message: "我目前在資料庫中找不到完全符合這些關鍵字的系所資訊。不如您再換個關鍵字（例如：校名或具體系所名）跟我說說？"
        };
        await appendChatHistory(chatHistoryId, messages, message, JSON.stringify(fallbackResponse));
        return fallbackResponse;
    }

    // Step 3: Final Selection (RAG)
    const ragPrompt = `
以下是從我們的真實研究所資料庫中檢索到的 10 筆原始資料：
${JSON.stringify(searchResults.map(s => ({ school: s.school_name, program: s.program_name, city: s.city, overview: s.program_overview })), null, 2)}

請根據剛才用戶的對話歷史，從這 10 筆資料中「嚴格挑選」出最適合的 3 筆推薦給用戶。
你的回覆必須包含對這 3 筆資料的精確校名與系所名，並且給出推薦理由。
你「絕對不能」推薦名單以外的系所。
`;

    const finalResult = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
            systemInstruction: SYSTEM_PROMPT + ragPrompt,
            responseMimeType: 'application/json',
            responseSchema: recommendationSchema,
        }
    });

    const finalText = finalResult.text;
    if (!finalText) throw new Error('Empty response from model in step 3');

    const finalJson = JSON.parse(finalText) as AiResponse;
    await appendChatHistory(chatHistoryId, messages, message, finalText);

    return finalJson;
}
