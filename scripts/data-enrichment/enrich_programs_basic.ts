import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

const CSV_PATH = '/Users/laizelin/Downloads/114_ulistdepartmentlist_college.csv';

async function cleanDegrees() {
    console.log('🧹 1. 開始清理 programs 的 degree 欄位格式...');

    // We can fetch all programs and update them if they contain '['
    let programs: any[] = [];
    let from = 0;
    while (true) {
        const { data: batch } = await supabase
            .from('programs')
            .select('program_id, degree')
            .like('degree', '%[%')
            .range(from, from + 999);

        if (!batch || batch.length === 0) break;
        programs.push(...batch);
        from += 1000;
    }

    if (programs.length === 0) {
        console.log('✅ 已經沒有需要清理的 degree 欄位了。');
        return;
    }

    let updatedCount = 0;
    // Update them sequentially or in batches
    for (const p of programs) {
        let cleanDegree = p.degree;
        if (cleanDegree.includes('碩士')) cleanDegree = '碩士';
        else if (cleanDegree.includes('博士')) cleanDegree = '博士';
        else cleanDegree = cleanDegree.replace(/[\[\]"]/g, ''); // Fallback strip array chars

        const { error } = await supabase
            .from('programs')
            .update({ degree: cleanDegree })
            .eq('program_id', p.program_id);

        if (!error) {
            updatedCount++;
            if (updatedCount % 50 === 0) console.log(`   Processed ${updatedCount}...`);
        }
    }

    console.log(`✅ 成功清理了 ${updatedCount} 筆系所的神奇 degree 格式。`);
}

async function syncWebsites() {
    console.log('🌐 2. 開始從 CSV 檔同步系所 website...');

    if (!fs.existsSync(CSV_PATH)) {
        console.log(`❌ 找不到 CSV 檔: ${CSV_PATH}`);
        return;
    }

    const fileContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        from_line: 2
    }) as any[];

    console.log(`讀取到 ${records.length} 筆 CSV 資料，開始比對...`);

    // Fetch all schools and their programs to build a lookup map
    let allPrograms: any[] = [];
    let fromProg = 0;
    while (true) {
        const { data: batch, error } = await supabase
            .from('programs')
            .select('program_id, name, school_id, schools(name)')
            .range(fromProg, fromProg + 999);

        if (error) {
            console.error('Failed to fetch programs batch:', error);
            break;
        }
        if (!batch || batch.length === 0) break;

        allPrograms.push(...batch);
        fromProg += 1000;
    }

    if (allPrograms.length === 0) {
        console.error('No programs found in DB.');
        return;
    }

    // Map: SchoolName -> ProgramName -> ProgramId
    const programMap = new Map<string, Map<string, string>>();
    for (const p of allPrograms) {
        // @ts-ignore
        const schoolName = p.schools?.name as string;
        if (!programMap.has(schoolName)) {
            programMap.set(schoolName, new Map());
        }
        programMap.get(schoolName)!.set(p.name, p.program_id);
    }

    let updatedCount = 0;
    const updateBatch: { program_id: string, website: string }[] = [];

    for (const record of records) {
        let schoolName = record['學校名稱'];
        const programName = record['系所名稱'];
        const website = record['系所網址'];

        if (!schoolName || !programName || !website) continue;

        // Remove spaces for robust matching because CSV contains '國立清華大學  ' sometimes
        schoolName = schoolName.trim();
        // Remove internal spaces
        schoolName = schoolName.replace(/\s+/g, '');

        const schMap = programMap.get(schoolName);
        if (schMap) {
            const progId = schMap.get(programName);
            if (progId) {
                updateBatch.push({ program_id: progId, website });
            }
        }
    }

    console.log(`🔍 比對完成，共找到 ${updateBatch.length} 筆相符的網站資訊，開始更新...`);

    const chunkSize = 50;
    for (let i = 0; i < updateBatch.length; i += chunkSize) {
        const chunk = updateBatch.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (update) => {
            const { error } = await supabase
                .from('programs')
                .update({ website: update.website })
                .eq('program_id', update.program_id);

            if (error) {
                console.error(`Failed to update website for ${update.program_id}:`, error);
            }
        }));

        updatedCount += chunk.length;
        console.log(`   Updated ${updatedCount}/${updateBatch.length} websites...`);
    }

    console.log(`✅ 成功同步了 ${updatedCount} 筆系所的 website。`);
}

async function main() {
    await cleanDegrees();
    await syncWebsites();
    console.log('🎉 基礎資料擴充完成！');
}

main().catch(console.error);
