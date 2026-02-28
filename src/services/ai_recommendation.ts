import { checkAndConsumeQuota } from './quota';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the API outside so it's ready. If key is missing, throw on first use.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RecommendationResult {
    school_name: string;
    program_name: string;
    reason: string;
}

const SYSTEM_PROMPT = `你是一個專業的台灣研究所推甄與考試升學顧問。
你的目標是根據使用者的背景、興趣與問題，推薦 3 個最適合的台灣大專院校碩士班系所。
請根據台灣現有的國立、私立大學及科技大學的實際系所名稱進行推薦。
回覆必須嚴格遵守 JSON 格式，包含 3 個推薦項目。每個項目要有 school_name (學校名稱，如：國立中央大學)、program_name (系所名稱，如：企業管理學系) 與 reason (推薦理由，約 50 字內，說明為何適合)。
`;

/**
 * 根據使用者的問題，呼叫 Gemini API 取得推薦名單
 */
export async function getRecommendations(userId: string, userMessage: string): Promise<RecommendationResult[] | null> {
    // 檢查額度
    const allowed = await checkAndConsumeQuota(userId);
    if (!allowed) {
        throw new Error('QUOTA_EXCEEDED');
    }

    try {
        // 第一選擇模式：gemini-2.5-flash
        return await invokeGeminiModel('gemini-2.5-flash', userMessage);
    } catch (error: any) {
        console.warn('First model failed, falling back to gemini-2.0-flash:', error.message);
        try {
            // 降級模式
            return await invokeGeminiModel('gemini-2.0-flash', userMessage);
        } catch (fbError: any) {
            console.error('Fallback model also failed:', fbError.message);
            return null;
        }
    }
}

async function invokeGeminiModel(modelName: string, message: string): Promise<RecommendationResult[]> {
    const responseSchema: Schema = {
        type: Type.ARRAY,
        description: "List of 3 recommended graduate programs",
        items: {
            type: Type.OBJECT,
            properties: {
                school_name: {
                    type: Type.STRING,
                    description: "Full name of the university, e.g., 國立臺灣大學"
                },
                program_name: {
                    type: Type.STRING,
                    description: "Full name of the program, e.g., 資訊工程學系"
                },
                reason: {
                    type: Type.STRING,
                    description: "Short reason for recommendation"
                }
            },
            required: ["school_name", "program_name", "reason"]
        }
    };

    const response = await ai.models.generateContent({
        model: modelName,
        contents: message,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.7,
        }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from model');

    return JSON.parse(text) as RecommendationResult[];
}
