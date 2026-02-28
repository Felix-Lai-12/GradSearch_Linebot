import { GoogleGenAI, Type, Schema } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Initialize the API outside so it's ready. If key is missing, throw on first use.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface BugFixResult {
    is_fixable: boolean;
    fix_type: 'URL_UPDATE' | 'ALIAS_ADD' | 'UNKNOWN';
    target_school?: string;
    target_program?: string;
    new_url?: string;
    new_alias?: string;
    success?: boolean;
    message?: string;
}

const SYSTEM_PROMPT = `
你是一個台灣研究所資料庫的自動修復 AI。
使用者回報了一個 Bug 訊息。請判斷這個 Bug 是否有提供足夠的明確資訊，讓我們能自動修正資料庫。

你可以處理兩種問題：
1. URL_UPDATE: 使用者指出某個系所的官網網址或簡章連結是錯的，並提供了覺得是正確的網址。
2. ALIAS_ADD: 使用者指出某個簡寫或俗稱（例如"交大資工"、"台大中文"）無法搜尋或配對不到。

**重要：對於 ALIAS_ADD 類型**
- new_alias 應該只包含「系所」的簡稱部分，不要包含學校簡稱
- 例如：用戶說「Ntu中文找不到」→ new_alias 應該是「中文」，而不是「Ntu中文」
- 例如：用戶說「台大資工找不到」→ new_alias 應該是「資工」，而不是「台大資工」
- 學校簡稱（如 Ntu、台大）通常已經存在，不需要重複新增

如果有明確資訊，請設定 is_fixable 為 true，並擷取必要的欄位。若資訊不足判斷，is_fixable 為 false。
`;

const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        is_fixable: { type: Type.BOOLEAN, description: '是否可以自動修復' },
        fix_type: { type: Type.STRING, description: '修復類型: URL_UPDATE, ALIAS_ADD, 或 UNKNOWN' },
        target_school: { type: Type.STRING, description: '推測的正式學校名稱，例如：國立臺灣大學' },
        target_program: { type: Type.STRING, description: '推測的正式系所名稱，例如：中國文學系。如果沒有則留空。' },
        new_url: { type: Type.STRING, description: '如果 fix_type 包含 URL，這裡放提取出的正確網址' },
        new_alias: { type: Type.STRING, description: '如果 fix_type 包含 ALIAS，這裡放系所的簡稱（不含學校名），例如：中文、資工、電機' }
    },
    required: ['is_fixable', 'fix_type']
};

export async function processBugReport(userText: string): Promise<BugFixResult> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using gemini-2.5-pro which is the latest highest reasoning model available in the API list
            contents: userText,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1, // 低 temperature 保持精準實體擷取
            }
        });

        const resultJson = response.text || '';
        const parsed: BugFixResult = JSON.parse(resultJson);

        if (!parsed.is_fixable || parsed.fix_type === 'UNKNOWN') {
            return { ...parsed, success: false, message: '無法自動判斷或資訊不足' };
        }

        return await executeAutoFix(parsed);
    } catch (error) {
        console.error('Error in AI Bug Fixer:', error);
        return { is_fixable: false, fix_type: 'UNKNOWN', success: false, message: 'LLM 解析或執行異常' };
    }
}

async function executeAutoFix(parsed: BugFixResult): Promise<BugFixResult> {
    if (!parsed.target_school) {
        return { ...parsed, success: false, message: '缺少目標學校名稱' };
    }

    // 1. 尋找 School
    const { data: schools } = await supabase.from('schools')
        .select('school_id')
        .ilike('name', `%${parsed.target_school}%`)
        .limit(1);

    if (!schools || schools.length === 0) {
        return { ...parsed, success: false, message: `找不到該學校：${parsed.target_school}` };
    }
    const schoolId = schools[0].school_id;

    // 2. 處理 URL_UPDATE
    if (parsed.fix_type === 'URL_UPDATE' && parsed.new_url) {
        if (!parsed.target_program) {
            return { ...parsed, success: false, message: '修復網址必須要明確指名系所' };
        }

        const { data: programs } = await supabase.from('programs')
            .select('program_id')
            .eq('school_id', schoolId)
            .ilike('name', `%${parsed.target_program}%`)
            .limit(1);

        if (!programs || programs.length === 0) {
            return { ...parsed, success: false, message: `找不到該系所：${parsed.target_program}` };
        }
        const programId = programs[0].program_id;

        // 簡單判斷要更新 programs.website 還是 program_applications.source_url
        // 這邊預設更新 website，如果有 "簡章" "報名" 關鍵字可透過後續優化更新 source_url
        // 為了安全先更新 programs.website (因這比較常是系網)
        const { error } = await supabase.from('programs')
            .update({ website: parsed.new_url })
            .eq('program_id', programId);

        if (error) {
            return { ...parsed, success: false, message: '資料庫更新失敗' };
        }
        return { ...parsed, success: true, message: '已成功更新系所官網網址' };
    }

    // 3. 處理 ALIAS_ADD
    if (parsed.fix_type === 'ALIAS_ADD' && parsed.new_alias) {
        if (parsed.target_program) {
            // 系所 Alias
            const { data: programs } = await supabase.from('programs')
                .select('program_id')
                .eq('school_id', schoolId)
                .ilike('name', `%${parsed.target_program}%`)
                .limit(1);
            if (!programs || programs.length === 0) {
                return { ...parsed, success: false, message: `找不到該正確系所：${parsed.target_program}` };
            }
            const { error } = await supabase.from('program_aliases').insert({
                program_id: programs[0].program_id,
                alias: parsed.new_alias
            });
            if (error) return { ...parsed, success: false, message: '新增系所 Alias 失敗' };
            return { ...parsed, success: true, message: '已成功新增系所關鍵字' };
        } else {
            // 學校 Alias
            const { error } = await supabase.from('school_aliases').insert({
                school_id: schoolId,
                alias: parsed.new_alias
            });
            if (error) return { ...parsed, success: false, message: '新增學校 Alias 失敗' };
            return { ...parsed, success: true, message: '已成功新增學校關鍵字' };
        }
    }

    return { ...parsed, success: false, message: '不支援的修復類型，已交由人工確認！' };
}
