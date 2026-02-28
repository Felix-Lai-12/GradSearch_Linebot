/**
 * generate_aliases.ts
 *
 * 自動為 schools 和 programs 產生別名
 * 讀取 Supabase 中的資料，產生常見簡稱，upsert 到 aliases 表
 *
 * Usage: npx ts-node scripts/generate_aliases.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// ============================================================
// 常見的英文簡稱對照表
// ============================================================
const SCHOOL_ENGLISH_ALIASES: Record<string, string[]> = {
    '國立臺灣大學': ['NTU'],
    '國立清華大學': ['NTHU'],
    '國立成功大學': ['NCKU'],
    '國立交通大學': ['NCTU'],
    '國立陽明交通大學': ['NYCU'],
    '國立政治大學': ['NCCU'],
    '國立中央大學': ['NCU'],
    '國立中興大學': ['NCHU'],
    '國立中山大學': ['NSYSU'],
    '國立臺灣師範大學': ['NTNU'],
    '國立臺灣科技大學': ['NTUST'],
    '國立臺北大學': ['NTPU'],
    '國立臺北科技大學': ['NTUT'],
    '國立臺灣海洋大學': ['NTOU'],
    '國立彰化師範大學': ['NCUE'],
    '國立高雄師範大學': ['NKNU'],
    '國立嘉義大學': ['NCYU'],
    '國立宜蘭大學': ['NIU'],
    '國立東華大學': ['NDHU'],
    '國立暨南國際大學': ['NCNU'],
    '國立屏東大學': ['NPTU'],
    '國立雲林科技大學': ['YunTech'],
    '國立高雄大學': ['NUK'],
    '國立聯合大學': ['NUU'],
    '國立臺中教育大學': ['NTCU'],
    '國立臺南大學': ['NUTN'],
    '國立臺東大學': ['NTTU'],
};

// 常見的系所英文簡稱
const PROGRAM_ENGLISH_ALIASES: Record<string, string[]> = {
    '國際企業學研究所': ['IB', 'International Business'],
    '企業管理學系': ['MBA', 'Business Administration'],
    '資訊工程學系': ['CS', 'Computer Science'],
    '電機工程學系': ['EE', 'Electrical Engineering'],
    '機械工程學系': ['ME', 'Mechanical Engineering'],
    '化學工程學系': ['ChemE', 'Chemical Engineering'],
    '土木工程學系': ['CE', 'Civil Engineering'],
    '工業工程學系': ['IE', 'Industrial Engineering'],
    '財務金融學系': ['Finance'],
    '會計學系': ['Accounting'],
    '經濟學系': ['Economics'],
    '法律學系': ['Law'],
    '心理學系': ['Psychology'],
    '社會學系': ['Sociology'],
    '數學系': ['Math'],
    '物理學系': ['Physics'],
    '化學系': ['Chemistry'],
    '生物學系': ['Biology'],
};

/**
 * 學校別名產生規則
 */
function generateSchoolAliases(name: string): string[] {
    const aliases: string[] = [];

    // 1. 繁體 → 簡體常見替換
    const simplified = name
        .replace('臺', '台')
        .replace('國立', '')
        .replace('私立', '')
        .trim();

    // 2. 去掉「大學」產生短名
    const shortName = simplified
        .replace('科技大學', '')
        .replace('大學', '')
        .trim();

    // 3. 完整名（不含國立/私立）
    if (simplified !== name) {
        aliases.push(simplified);
    }

    // 4. 短名
    if (shortName.length >= 2 && shortName !== simplified) {
        aliases.push(shortName);
    }

    // 5. 原名的「臺→台」替換
    if (name.includes('臺')) {
        aliases.push(name.replace(/臺/g, '台'));
    }

    // 6. 英文簡稱
    const englishAliases = SCHOOL_ENGLISH_ALIASES[name];
    if (englishAliases) {
        aliases.push(...englishAliases);
    }

    // 7. 名稱比對與簡稱 (Special Rules)
    const match = name.match(/(?:國立|私立)(.+?)(?:科技大學|大學|學院)/);
    if (match) {
        const core = match[1];

        // A. Whitelist of well-known schools
        if (name === '國立臺灣大學') {
            aliases.push('台大', '臺大', '台灣大學');
        } else if (name === '國立成功大學') {
            aliases.push('成大');
        } else if (name === '國立清華大學') {
            aliases.push('清大');
        } else if (name === '國立政治大學') {
            aliases.push('政大', '政治大學');
        } else if (name.includes('陽明交通大學')) {
            aliases.push('陽明交大', '交大');
        } else if (name.includes('交通大學')) {
            aliases.push('交大');
        } else if (name === '國立中山大學') {
            aliases.push('中山', '中山大學');
        } else if (name === '國立中央大學') {
            aliases.push('中大', '中央');
        } else if (name === '國立東華大學') {
            aliases.push('東華');
        } else if (name === '國立中興大學') {
            aliases.push('興大', '中興');
        } else if (name === '國立臺北大學') {
            aliases.push('北大', '台北大學', '臺北大學');
        }

        // B. Category-based rules
        if (name.includes('師範大學')) {
            aliases.push('師大');
            if (name.includes('臺灣師範')) aliases.push('台師大', '臺師大');
            if (name.includes('彰化師範')) aliases.push('彰師大');
            if (name.includes('高雄師範')) aliases.push('高師大');
        } else if (name.includes('科技大學')) {
            if (name.includes('臺灣科技')) aliases.push('台科大', '台科');
            else if (name.includes('臺北科技')) aliases.push('北科大', '北科');
            else if (name.includes('雲林科技')) aliases.push('雲科大', '雲科');
            else if (name.includes('屏東科技')) aliases.push('屏科大');
            else aliases.push(core[0] + '科大');
        } else if (name.includes('醫學大學')) {
            if (name.includes('臺北醫學')) aliases.push('北醫');
            else if (name.includes('高雄醫學')) aliases.push('高醫');
            else if (name.includes('中國醫藥')) aliases.push('中醫大');
        }

        // C. General fallback: Take first 2 chars
        if (aliases.length === 0 && core.length >= 2) {
            const short = core.substring(0, 2);
            aliases.push(short);
            aliases.push(short.replace('臺', '台'));
            aliases.push(short + '大');
            aliases.push(short.replace('臺', '台') + '大');
        }
    }

    // Deduplicate and remove the original name
    return [...new Set(aliases)].filter(a => a !== name && a.length >= 2);
}

/**
 * 系所別名產生規則
 */
function generateProgramAliases(name: string): string[] {
    const aliases: string[] = [];

    // 1. 去掉「碩士班」「博士班」後綴
    let baseName = name
        .replace(/碩士班$/, '')
        .replace(/博士班$/, '')
        .replace(/碩士在職專班$/, '')
        .replace(/在職專班$/, '')
        .trim();

    // 2. 去掉「學系」「研究所」產生簡稱
    const shortName = baseName
        .replace(/學研究所$/, '')
        .replace(/研究所$/, '')
        .replace(/學系$/, '')
        .replace(/學程$/, '')
        .trim();

    // 3. 基本名不含班別
    if (baseName !== name) {
        aliases.push(baseName);
    }

    // 4. 簡稱 + 「所」
    if (shortName.length >= 2 && shortName !== baseName && shortName !== name) {
        aliases.push(shortName);
        aliases.push(shortName + '所');
    }

    // 5. 更短的簡稱（取前2-3字）
    const commonShortcuts: Record<string, string[]> = {
        '資訊工程': ['資工', '資工所'],
        '電機工程': ['電機', '電機所'],
        '機械工程': ['機械', '機械所'],
        '化學工程': ['化工', '化工所'],
        '土木工程': ['土木', '土木所'],
        '工業工程': ['工工', '工工所'],
        '企業管理': ['企管', '企管所'],
        '國際企業': ['國企', '國企所'],
        '財務金融': ['財金', '財金所'],
        '財務管理': ['財管', '財管所'],
        '資訊管理': ['資管', '資管所'],
        '會計': ['會計所'],
        '經濟': ['經濟所'],
        '法律': ['法律所'],
        '社會': ['社會所'],
        '心理': ['心理所'],
        '數學': ['數學所'],
        '物理': ['物理所'],
        '化學': ['化學所'],
        '生物': ['生物所'],
        '電子工程': ['電子', '電子所'],
        '材料科學': ['材料', '材料所'],
        '環境工程': ['環工', '環工所'],
        '建築': ['建築所'],
        '統計': ['統計所'],
        '哲學': ['哲學所'],
        '歷史': ['歷史所'],
        '中國文學': ['中文', '中文所'],
        '外國語文': ['外文', '外文所'],
        '公共行政': ['公行', '公行所'],
        '公共衛生': ['公衛', '公衛所'],
        '傳播': ['傳播所'],
        '新聞': ['新聞所'],
        '政治': ['政治所'],
        '商學': ['商學所'],
        '生命科學': ['生科', '生科所'],
        '光電工程': ['光電', '光電所'],
        '通訊工程': ['通訊', '通訊所'],
        '航太工程': ['航太', '航太所'],
        '動力機械': ['動機', '動機所'],
        '工程與系統': ['工科', '工科所'],
    };

    for (const [keyword, shortcuts] of Object.entries(commonShortcuts)) {
        if (shortName.includes(keyword) || baseName.includes(keyword)) {
            aliases.push(...shortcuts);
        }
    }

    // 6. 英文簡稱
    for (const [programName, engAliases] of Object.entries(PROGRAM_ENGLISH_ALIASES)) {
        if (name.includes(programName.replace(/學系$/, '').replace(/研究所$/, ''))) {
            aliases.push(...engAliases);
        }
    }

    return [...new Set(aliases)].filter(a => a !== name && a.length >= 2);
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
    console.log('🏷️  GradSearch Alias Generator');
    console.log('━'.repeat(50));

    // Get all schools
    const { data: schools } = await supabase
        .from('schools')
        .select('school_id, name');

    if (!schools || schools.length === 0) {
        console.log('No schools found. Run crawl_schools.ts first.');
        return;
    }

    // Get existing aliases to avoid duplicates
    const { data: existingSchoolAliases } = await supabase
        .from('school_aliases')
        .select('school_id, alias');

    const existingSchoolAliasSet = new Set<string>();
    if (existingSchoolAliases) {
        for (const a of existingSchoolAliases) {
            existingSchoolAliasSet.add(`${a.school_id}|${a.alias}`);
        }
    }

    // Generate school aliases
    let schoolAliasCount = 0;
    const newSchoolAliases: Array<{ school_id: string; alias: string }> = [];

    for (const school of schools) {
        const aliases = generateSchoolAliases(school.name);
        for (const alias of aliases) {
            const key = `${school.school_id}|${alias}`;
            if (!existingSchoolAliasSet.has(key)) {
                newSchoolAliases.push({ school_id: school.school_id, alias });
                schoolAliasCount++;
            }
        }
    }

    // Insert school aliases in batches
    for (let i = 0; i < newSchoolAliases.length; i += 50) {
        const batch = newSchoolAliases.slice(i, i + 50);
        const { error } = await supabase.from('school_aliases').insert(batch);
        if (error) {
            console.error(`School aliases batch ${i} error:`, error.message);
        }
    }

    console.log(`🏫 Generated ${schoolAliasCount} new school aliases for ${schools.length} schools`);

    // Get all programs (with pagination)
    let programs: any[] = [];
    let from = 0;
    while (true) {
        const { data: batch } = await supabase
            .from('programs')
            .select('program_id, name')
            .range(from, from + 999);
        if (!batch || batch.length === 0) break;
        programs.push(...batch);
        from += 1000;
    }

    if (programs.length === 0) {
        console.log('No programs found.');
        return;
    }

    // Get existing program aliases
    const { data: existingProgramAliases } = await supabase
        .from('program_aliases')
        .select('program_id, alias');

    const existingProgramAliasSet = new Set<string>();
    if (existingProgramAliases) {
        for (const a of existingProgramAliases) {
            existingProgramAliasSet.add(`${a.program_id}|${a.alias}`);
        }
    }

    // Generate program aliases
    let programAliasCount = 0;
    const newProgramAliases: Array<{ program_id: string; alias: string }> = [];

    for (const program of programs) {
        const aliases = generateProgramAliases(program.name);
        for (const alias of aliases) {
            const key = `${program.program_id}|${alias}`;
            if (!existingProgramAliasSet.has(key)) {
                newProgramAliases.push({ program_id: program.program_id, alias });
                programAliasCount++;
            }
        }
    }

    // Insert program aliases in batches
    for (let i = 0; i < newProgramAliases.length; i += 100) {
        const batch = newProgramAliases.slice(i, i + 100);
        const { error } = await supabase.from('program_aliases').insert(batch);
        if (error) {
            console.error(`Program aliases batch ${i} error:`, error.message);
        }
    }

    console.log(`📚 Generated ${programAliasCount} new program aliases for ${programs.length} programs`);


    // Summary
    const { count: totalSchoolAliases } = await supabase
        .from('school_aliases')
        .select('*', { count: 'exact', head: true });
    const { count: totalProgramAliases } = await supabase
        .from('program_aliases')
        .select('*', { count: 'exact', head: true });

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Alias generation complete!');
    console.log(`   🏫 Total school aliases: ${totalSchoolAliases}`);
    console.log(`   📚 Total program aliases: ${totalProgramAliases}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
