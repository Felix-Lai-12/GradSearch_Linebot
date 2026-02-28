/**
 * crawl_schools.ts
 *
 * Layer 1 爬蟲：使用 Firecrawl 爬取 udb.moe.edu.tw 全台學校+研究所名單
 * 只匯入碩士班/博士班，upsert 到 Supabase schools + programs 表
 *
 * Usage: npx ts-node scripts/crawl_schools.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

// ISCED 學門分類（25 個）
const ISCED_CATEGORIES: Array<{ code: string; name: string }> = [
    { code: '011', name: '教育' },
    { code: '021', name: '藝術' },
    { code: '022', name: '人文' },
    { code: '023', name: '語文' },
    { code: '031', name: '社會及行為科學' },
    { code: '032', name: '新聞學及圖書資訊' },
    { code: '041', name: '商業及管理' },
    { code: '042', name: '法律' },
    { code: '051', name: '生命科學' },
    { code: '052', name: '環境' },
    { code: '053', name: '物理化學及地球科學' },
    { code: '054', name: '數學及統計' },
    { code: '061', name: '資訊通訊科技' },
    { code: '071', name: '工程及工程業' },
    { code: '072', name: '製造及加工' },
    { code: '073', name: '建築及營建工程' },
    { code: '081', name: '農業' },
    { code: '082', name: '林業' },
    { code: '083', name: '漁業' },
    { code: '084', name: '獸醫' },
    { code: '091', name: '醫藥衛生' },
    { code: '092', name: '社會福利' },
    { code: '101', name: '餐旅及民生服務' },
    { code: '102', name: '衛生及職業衛生服務' },
    { code: '103', name: '安全服務' },
    // { code: '104', name: '運輸服務' },  // 通常很少研究所
    // { code: '999', name: '其他' },
];

interface SchoolData {
    name: string;
    public_private: string;
    website: string;
    institution_id: string;
}

interface ProgramData {
    school_name: string;
    name: string;
    degree: string;
    discipline: string;
    department_url: string;
}

/**
 * 從 ISCED 頁面的 markdown 解析出學校+系所
 */
function parseISCEDPage(markdown: string, discipline: string): { schools: SchoolData[]; programs: ProgramData[] } {
    const schools: SchoolData[] = [];
    const programs: ProgramData[] = [];
    const schoolMap = new Map<string, SchoolData>();

    // Parse markdown links
    // Firecrawl outputs tables with <br> inside cells, we must split them into actual lines
    const normalizedMarkdown = markdown
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\|/g, '\n');
    const lines = normalizedMarkdown.split('\n');
    let currentSchool: SchoolData | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match school links
        const schoolMatch = line.match(/\[([^\]]+)\]\(https:\/\/udb\.moe\.edu\.tw\/ulist\/Institution\?id=([^)]+)\)/);
        if (schoolMatch) {
            const schoolName = schoolMatch[1].trim();
            const institutionId = schoolMatch[2];
            const isPublic = schoolName.startsWith('國立') || schoolName.startsWith('市立');

            if (!schoolMap.has(schoolName)) {
                currentSchool = {
                    name: schoolName,
                    public_private: isPublic ? '公立' : '私立',
                    website: `https://udb.moe.edu.tw/ulist/Institution?id=${institutionId}`,
                    institution_id: institutionId,
                };
                schoolMap.set(schoolName, currentSchool);
                schools.push(currentSchool);
            } else {
                currentSchool = schoolMap.get(schoolName)!;
            }
            continue;
        }

        // Match department links
        const deptMatch = line.match(/\[([^\]]+)\]\((https:\/\/udb\.moe\.edu\.tw\/ulist\/Department\?[^)]+)\)/);
        if (deptMatch && currentSchool) {
            const deptName = deptMatch[1].trim();
            const deptUrl = deptMatch[2];

            const fullText = line;
            const hasMaster = fullText.includes('碩士') || fullText.includes('研究所') || deptName.includes('碩士') || deptName.includes('研究所');
            const hasPhd = fullText.includes('博士') || deptName.includes('博士');

            if (hasMaster) {
                programs.push({ school_name: currentSchool.name, name: deptName, degree: '碩士', discipline, department_url: deptUrl });
            }
            if (hasPhd) {
                programs.push({ school_name: currentSchool.name, name: deptName, degree: '博士', discipline, department_url: deptUrl });
            }

            // If degree info is not on the same line, look ahead up to 3 lines
            if (!hasMaster && !hasPhd) {
                for (let j = 1; j <= 3 && i + j < lines.length; j++) {
                    const nextLine = lines[i + j];
                    // Stop if we hit another link
                    if (nextLine.includes('[')) break;

                    if (nextLine.includes('碩') || nextLine.includes('博') || nextLine.includes('研究所')) {
                        if (nextLine.includes('碩') || nextLine.includes('研究所')) {
                            programs.push({ school_name: currentSchool.name, name: deptName, degree: '碩士', discipline, department_url: deptUrl });
                        }
                        if (nextLine.includes('博')) {
                            programs.push({ school_name: currentSchool.name, name: deptName, degree: '博士', discipline, department_url: deptUrl });
                        }
                        break;
                    }
                }
            }
        }
    }

    return { schools, programs };
}

/**
 * 爬取單一 ISCED 頁面（含分頁）
 */
async function scrapeISCEDCategory(category: { code: string; name: string }): Promise<{ schools: SchoolData[]; programs: ProgramData[] }> {
    const allSchools: SchoolData[] = [];
    const allPrograms: ProgramData[] = [];
    const seenSchools = new Set<string>();

    let pageIndex = 1;
    let hasMore = true;

    while (hasMore) {
        const url = pageIndex === 1
            ? `https://udb.moe.edu.tw/ulist/ISCED/${category.code}`
            : `https://udb.moe.edu.tw/ulist/ISCED/${category.code}?index=${pageIndex}`;

        console.log(`   📄 Page ${pageIndex}: ${url}`);

        try {
            const result = await firecrawl.scrape(url, {
                formats: ['markdown'],
            }) as any;

            if (!result.success && !result.markdown) {
                console.log(`   ⚠️ No content on page ${pageIndex}, stopping.`);
                hasMore = false;
                break;
            }

            const { schools, programs } = parseISCEDPage(result.markdown, category.name);

            // Deduplicate schools
            for (const school of schools) {
                if (!seenSchools.has(school.name)) {
                    seenSchools.add(school.name);
                    allSchools.push(school);
                }
            }

            allPrograms.push(...programs);

            // Check if there's a next page link
            if (result.markdown.includes(`index=${pageIndex + 1}`) || result.markdown.includes('下一頁')) {
                pageIndex++;
            } else {
                hasMore = false;
            }

            // Rate limit: pause between requests
            await sleep(1000);
        } catch (err: any) {
            console.error(`   ❌ Error scraping page ${pageIndex}:`, err.message);
            hasMore = false;
        }
    }

    return { schools: allSchools, programs: allPrograms };
}

/**
 * Upsert schools to Supabase
 */
async function upsertSchools(schools: SchoolData[]): Promise<Map<string, string>> {
    const nameToId = new Map<string, string>();

    // Get existing schools first
    const { data: existing } = await supabase.from('schools').select('school_id, name');
    if (existing) {
        for (const s of existing) {
            nameToId.set(s.name, s.school_id);
        }
    }

    // Insert new schools
    const newSchools = schools.filter(s => !nameToId.has(s.name));
    if (newSchools.length > 0) {
        // Insert in batches of 50
        for (let i = 0; i < newSchools.length; i += 50) {
            const batch = newSchools.slice(i, i + 50).map(s => ({
                name: s.name,
                public_private: s.public_private,
                website: s.website,
                country: 'TW',
            }));

            const { data, error } = await supabase
                .from('schools')
                .insert(batch)
                .select('school_id, name');

            if (error) {
                console.error('Insert schools error:', error.message);
            } else if (data) {
                for (const s of data) {
                    nameToId.set(s.name, s.school_id);
                }
            }
        }
    }

    return nameToId;
}

/**
 * Upsert programs to Supabase
 */
async function upsertPrograms(
    programs: ProgramData[],
    schoolNameToId: Map<string, string>
): Promise<void> {
    // Get existing programs to avoid duplicates
    const { data: existing } = await supabase
        .from('programs')
        .select('program_id, school_id, name, degree');

    const existingSet = new Set<string>();
    if (existing) {
        for (const p of existing) {
            existingSet.add(`${p.school_id}|${p.name}|${p.degree}`);
        }
    }

    // Filter to only new programs
    const newPrograms = programs.filter(p => {
        const schoolId = schoolNameToId.get(p.school_name);
        if (!schoolId) return false;
        return !existingSet.has(`${schoolId}|${p.name}|${p.degree}`);
    });

    console.log(`\n📥 Inserting ${newPrograms.length} new programs (${programs.length} total found, ${programs.length - newPrograms.length} already exist)`);

    // Insert in batches
    for (let i = 0; i < newPrograms.length; i += 50) {
        const batch = newPrograms.slice(i, i + 50).map(p => ({
            school_id: schoolNameToId.get(p.school_name)!,
            name: p.name,
            degree: p.degree,
            discipline: p.discipline,
            website: p.department_url,
            country: 'TW',
        }));

        const { error } = await supabase.from('programs').insert(batch);
        if (error) {
            console.error(`Insert programs batch ${i} error:`, error.message);
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
    console.log('🚀 GradSearch Data Crawler — Layer 1');
    console.log('━'.repeat(50));
    console.log(`📡 Using Firecrawl to scrape udb.moe.edu.tw`);
    console.log(`📊 Categories: ${ISCED_CATEGORIES.length}`);
    console.log('');

    const allSchools: SchoolData[] = [];
    const allPrograms: ProgramData[] = [];
    const seenSchoolNames = new Set<string>();

    for (const category of ISCED_CATEGORIES) {
        console.log(`\n🔍 [${category.code}] ${category.name}`);

        const { schools, programs } = await scrapeISCEDCategory(category);

        for (const school of schools) {
            if (!seenSchoolNames.has(school.name)) {
                seenSchoolNames.add(school.name);
                allSchools.push(school);
            }
        }
        allPrograms.push(...programs);

        console.log(`   ✅ ${schools.length} schools, ${programs.length} programs (碩博)`);

        // Rate limit between categories
        await sleep(1500);
    }

    // Deduplicate programs
    const uniquePrograms = new Map<string, ProgramData>();
    for (const p of allPrograms) {
        const key = `${p.school_name}|${p.name}|${p.degree}`;
        if (!uniquePrograms.has(key)) {
            uniquePrograms.set(key, p);
        }
    }

    console.log('\n' + '━'.repeat(50));
    console.log(`📊 Total unique schools: ${allSchools.length}`);
    console.log(`📊 Total unique programs (碩博): ${uniquePrograms.size}`);
    console.log('');

    // Upsert to Supabase
    console.log('📤 Upserting schools to Supabase...');
    const schoolNameToId = await upsertSchools(allSchools);
    console.log(`   ✅ ${schoolNameToId.size} schools in DB`);

    console.log('📤 Upserting programs to Supabase...');
    await upsertPrograms(Array.from(uniquePrograms.values()), schoolNameToId);

    // Summary
    const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
    const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Crawl complete!');
    console.log(`   🏫 Schools in DB: ${schoolCount}`);
    console.log(`   📚 Programs in DB: ${programCount}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
