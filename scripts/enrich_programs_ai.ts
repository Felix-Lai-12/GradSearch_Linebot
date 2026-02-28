import { supabase } from '../src/db/supabase';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.FIRECRAWL_API_KEY;
const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

async function pollJob(jobId: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 2000)); // poll every 2 seconds

        try {
            const res = await axios.get(`https://api.firecrawl.dev/v1/extract/${jobId}`, { headers: HEADERS });
            const data = res.data;
            if (data && data.status === 'completed') {
                return data.data; // Usually data.data inside the response for extracted payload
            }
            if (data && data.status === 'failed') {
                throw new Error(`Job failed: ${JSON.stringify(data)}`);
            }
            // else 'processing' or 'pending', keep polling
            // console.log(`   ...(polling ${jobId}, status=${data.status})`);
        } catch (err: any) {
            console.error(`   Polling error:`, err.response?.data || err.message);
        }
    }
    throw new Error('Polling timeout limit reached');
}

async function main() {
    const args = process.argv.slice(2);
    let limit = 10;

    if (args.includes('--limit')) {
        const limitStr = args[args.indexOf('--limit') + 1];
        if (limitStr) limit = parseInt(limitStr, 10);
    }

    console.log(`🤖 開始使用 Firecrawl AI 補充系所資訊 (Batch Size = ${limit})`);

    const { data: programs, error: fetchError } = await supabase
        .from('programs')
        .select(`
            program_id, 
            name, 
            website, 
            school_id,
            schools (name)
        `)
        .not('website', 'is', null)
        .is('program_overview', null)
        .limit(limit);

    if (fetchError || !programs || programs.length === 0) {
        console.log('✅ 沒找到需要補充的系所。所有系所皆已處理，或是無法查詢。');
        return;
    }

    console.log(`找到 ${programs.length} 筆待處理資料...`);

    const extractPayload = {
        prompt: "Extract the core overview or mission of this academic program concisely (under 30 characters). Also find the URL for their curriculum/courses if present. Lastly, identify up to 10 key research areas or topics covered by this department.",
        schema: {
            type: "object",
            properties: {
                program_overview: {
                    type: "string",
                    description: "A concise 30-character summary of the program's academic mission or focus in traditional Chinese."
                },
                curriculum_url: {
                    type: "string",
                    description: "The absolute URL pointing to the curriculum, courses or degree requirements. Leave undefined if not found."
                },
                research_areas: {
                    type: "array",
                    items: { type: "string" },
                    description: "Up to 10 key research areas or academic focus fields mentioned by the program in traditional Chinese."
                }
            },
            required: ["program_overview"]
        }
    };

    let updatedCount = 0;

    for (const p of programs) {
        // @ts-ignore
        const schoolName = p.schools?.name as string;
        console.log(`\n⏳ 處理中 [${schoolName}] ${p.name} - ${p.website}`);

        try {
            // 1. Submit extract job
            const postRes = await axios.post('https://api.firecrawl.dev/v1/extract', {
                urls: [p.website],
                prompt: extractPayload.prompt,
                schema: extractPayload.schema
            }, { headers: HEADERS });

            const jobRes = postRes.data;
            if (!jobRes.success || !jobRes.id) {
                console.error(`   ❌ 提交任務失敗:`, jobRes);
                continue;
            }

            // 2. Poll for completion
            const scrapedArray = await pollJob(jobRes.id);
            // The result mapping depends on firecrawl array vs object. Usually it's an array of extracted objects for the urls
            const scrapedData = Array.isArray(scrapedArray) ? scrapedArray[0] : scrapedArray;

            if (scrapedData && scrapedData.program_overview) {
                console.log(`   💡 成功抽取！摘要: ${scrapedData.program_overview}`);

                const updatePayload: any = {
                    program_overview: scrapedData.program_overview,
                };

                if (scrapedData.curriculum_url) updatePayload.curriculum_url = scrapedData.curriculum_url;
                if (scrapedData.research_areas && scrapedData.research_areas.length > 0) {
                    updatePayload.research_areas = scrapedData.research_areas.slice(0, 10);
                }

                const { error: updateError } = await supabase
                    .from('programs')
                    .update(updatePayload)
                    .eq('program_id', p.program_id);

                if (updateError) {
                    console.error(`   ❌ 儲存至資料庫失敗:`, updateError);
                } else {
                    updatedCount++;
                }
            } else {
                console.error(`   ⚠️ 找不到 program_overview`, scrapedData);
            }

        } catch (err: any) {
            console.error(`   💥 爬蟲過程崩潰:`, err.response?.data || err.message);
        }
    }

    console.log(`\n🎉 🎉 批次處理完畢，成功擴充了 ${updatedCount}/${programs.length} 筆系所資料！`);
}

main().catch(console.error);
