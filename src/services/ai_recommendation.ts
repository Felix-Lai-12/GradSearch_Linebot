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

2. **推薦階段 (response_type: 'recommendation')**：
   - 當你認為掌握足夠資訊時，請在 'search_keywords' 欄位中提供最多 5 個關鍵字。
   - **關鍵字規範**：請使用系所縮寫或精確名稱，例如：['資工', '資管', '台大', '數據科學', '國立']。

### 注意事項
- 請全程使用繁體中文。
- 語氣要像一位溫暖、專業、且有洞察力的生涯諮詢師。
- 所有的推薦理由應聚焦於該系所的學術聲望、就業前景或與用戶興趣的匹配度。
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
