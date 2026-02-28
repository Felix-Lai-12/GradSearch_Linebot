import { checkAndConsumeQuota } from './quota';
import { GoogleGenAI, Type, Schema } from '@google/genai';

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
}

const SYSTEM_PROMPT = `你是一個專業的台灣研究所推甄與考試升學顧問兼生涯諮詢師。
你的目標是根據使用者的背景、興趣與問題，提供升學建議或推薦。
如果使用者提供的資訊「不足以」讓你做出精準推薦（例如尚未表明科系、興趣、想考的領域或目標學校，或者只是單純寒暄），請給予一段自然、同理心的文字 (reply_message) 引導，詢問他更多資訊（如「你可以多告訴我你大學修過什麼喜歡的課嗎？」），並將 response_type 設為 'chat'，不需回傳 recommendations。
如果使用者提供的資訊「已經足夠明確」，請推薦 3 個最適合的台灣大專院校碩士班系所。將 response_type 設為 'recommendation'，給予一段綜合分析的文字 (reply_message)，並在 recommendations 陣列中提供 3 個推薦項目。每個項目要有 school_name (如：國立中央大學)、program_name (如：企業管理學系) 與 reason (推薦理由，約 50 字內，說明為何適合)。
請務必確保推薦的學校和科系是台灣真實存在的大專院校碩士班。
回覆必須嚴格遵守 JSON 格式。
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

async function invokeGeminiModel(modelName: string, message: string): Promise<AiResponse> {
    const responseSchema: Schema = {
        type: Type.OBJECT,
        description: "AI response containing either a chat message or recommendations",
        properties: {
            response_type: {
                type: Type.STRING,
                description: "'chat' if asking for more info or normal conversation, 'recommendation' if providing specific programs.",
                enum: ['chat', 'recommendation']
            },
            reply_message: {
                type: Type.STRING,
                description: "A natural language conversational reply to the user."
            },
            recommendations: {
                type: Type.ARRAY,
                description: "List of 3 recommended graduate programs. Required only if response_type is 'recommendation'.",
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
            }
        },
        required: ["response_type", "reply_message"]
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

    return JSON.parse(text) as AiResponse;
}
