import { supabase } from '../db/supabase';

export interface ParsedQuery {
    schoolId: string | null;
    schoolName: string | null;
    programId: string | null;
    programName: string | null;
    remainingText: string;
}

/**
 * Alias 比對法：解析使用者輸入的關鍵字
 *
 * Flow:
 *   1. 掃描 school_aliases → 找出最長匹配的學校
 *   2. 剩餘字串掃描 program_aliases → 找出系所
 *   3. 如果都沒找到 → 回傳 null 讓 caller 做 fallback
 */
export async function parseKeyword(text: string): Promise<ParsedQuery> {
    const result: ParsedQuery = {
        schoolId: null,
        schoolName: null,
        programId: null,
        programName: null,
        remainingText: text.trim(), // Will be updated as we match aliases
    };

    if (!text) return result;

    // 1. Fetch all school aliases
    const { data: schoolAliases } = await supabase
        .from('school_aliases')
        .select('alias, school_id, schools(name)');

    if (schoolAliases && schoolAliases.length > 0) {
        // Find all candidates and store their position
        const candidates = schoolAliases
            .map(sa => ({ ...sa, pos: text.indexOf(sa.alias) }))
            .filter(sa => sa.pos !== -1)
            // Sort by: 1. Position (smaller is better), 2. Length (longer is better)
            .sort((a, b) => {
                if (a.pos !== b.pos) return a.pos - b.pos;
                return b.alias.length - a.alias.length;
            });

        if (candidates.length > 0) {
            const sa = candidates[0];
            result.schoolId = sa.school_id;
            // @ts-ignore
            result.schoolName = sa.schools?.name || sa.alias;
            // Remove the matched school alias from the text
            result.remainingText = text.replace(sa.alias, '').trim();
        }
    }

    // 2. Query program aliases
    // If a school was identified, we only fetch program aliases for that school to reduce collisions
    let query = supabase
        .from('program_aliases')
        .select('alias, program_id, programs!inner(name, school_id, degree)');

    if (result.schoolId) {
        query = query.eq('programs.school_id', result.schoolId);
    }

    const { data: programAliases } = await query;

    if (programAliases && programAliases.length > 0) {
        // Sort program aliases by:
        // 1. Max length of alias (longer match is better)
        // 2. Degree (prefer Master's/碩士 over Doctoral/博士)
        const sortedPrograms = programAliases.sort((a, b) => {
            if (b.alias.length !== a.alias.length) {
                return b.alias.length - a.alias.length;
            }
            const degreeA = (a.programs as any)?.degree || '';
            const degreeB = (b.programs as any)?.degree || '';
            if (degreeA === '碩士' && degreeB !== '碩士') return -1;
            if (degreeB === '碩士' && degreeA !== '碩士') return 1;
            return 0;
        });

        // Clean remaining text (remove "所", "學系", etc. at the end)
        const cleanedRemaining = result.remainingText
            .replace(/研究所$/, '')
            .replace(/學系$/, '')
            .replace(/碩士班$/, '')
            .replace(/博士班$/, '')
            .replace(/碩士$/, '')
            .replace(/博士$/, '')
            .replace(/[所班碩博系]$/, '')
            .trim();

        const searchTexts = [result.remainingText, cleanedRemaining].filter(t => t.length > 0);

        for (const sa of sortedPrograms) {
            for (const searchText of searchTexts) {
                // If the remaining text includes the program alias OR the program alias exact matches the search text
                if (searchText.includes(sa.alias) || sa.alias === searchText) {
                    const programData = sa.programs as any;
                    result.programId = sa.program_id;
                    result.programName = programData?.name || sa.alias;

                    // If no school was matched, assign the inferred school
                    if (!result.schoolId && programData?.school_id) {
                        result.schoolId = programData.school_id;
                    }

                    // Remove matched alias from remaining text
                    result.remainingText = result.remainingText.replace(sa.alias, '').trim();
                    break;
                }
            }
            if (result.programId) break;
        }
    }

    return result;
}

/**
 * Fallback 模糊搜尋：用 pg_trgm 在 programs 表搜尋
 */
export async function fuzzySearch(
    query: string,
    limit: number = 5
): Promise<Array<{ program_id: string; name: string; school_name: string }>> {
    const { data } = await supabase
        .from('programs')
        .select('program_id, name, schools(name)')
        .or(`name.ilike.%${query}%`)
        .limit(limit);

    if (!data) return [];

    return data.map(p => ({
        program_id: p.program_id,
        name: p.name,
        school_name: (p.schools as any)?.name || '',
    }));
}
