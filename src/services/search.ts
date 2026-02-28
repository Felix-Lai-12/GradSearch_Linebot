import { supabase } from '../db/supabase';
import { parseKeyword, fuzzySearch, ParsedQuery } from '../parsers/keyword';

export interface SearchResult {
    school_name: string;
    program_name: string;
    degree: string;
    admission_type: string | null;
    admission_year: number | null;
    apply_start_date: string | null;
    apply_end_date: string | null;
    result_announce_date: string | null;
    application_fee: number | null;
    interview_required: boolean | null;
    written_exam_required: boolean | null;
    portfolio_required: boolean | null;
    required_documents: any;
    source_url: string | null;
    data_status: string;
    verified_at: string | null;
    // programs 新欄位
    cohort_size: number | null;
    program_overview: string | null;
    curriculum_url: string | null;
    website: string | null;
    research_areas: string[];
    faculty_url: string | null;
    labs_url: string | null;
    program_id: string;
    // schools 新欄位
    qs_rank?: string | null;
    city?: string | null;
}

export interface SearchResponse {
    type: 'found' | 'not_found' | 'need_more_info' | 'suggestions';
    result?: SearchResult;
    suggestions?: Array<{ program_id: string; name: string; school_name: string }>;
    message?: string;
    parsed?: ParsedQuery;
}

/**
 * Main search function: parse keyword → query DB → return result
 */
export async function searchProgram(query: string): Promise<SearchResponse> {
    const parsed = await parseKeyword(query);

    // Case 1: Only school matched, no program
    if (parsed.schoolId && !parsed.programId) {
        return {
            type: 'need_more_info',
            message: `找到了「${parsed.schoolName}」，請再補充想查的系所名稱喔！\n\n例如：${parsed.schoolName?.replace('國立', '').replace('大學', '')}資工所`,
            parsed,
        };
    }

    // Case 2: Program matched (with or without school)
    if (parsed.programId) {
        const result = await getProgramDetails(parsed.programId);
        if (result) {
            return { type: 'found', result, parsed };
        }
    }

    // Case 3: No match at all → try fuzzy search
    const suggestions = await fuzzySearch(query);
    if (suggestions.length > 0) {
        return { type: 'suggestions', suggestions, parsed };
    }

    // Case 4: Nothing found
    return {
        type: 'not_found',
        message: `找不到「${query}」相關的研究所 😢\n\n請試試其他關鍵字，例如：台大國企所、清大資工`,
        parsed,
    };
}

/**
 * Get full program details including application info
 */
async function getProgramDetails(programId: string): Promise<SearchResult | null> {
    // Get program + school info (including new fields)
    const { data: program } = await supabase
        .from('programs')
        .select('*, schools(name, city, qs_rank)')
        .eq('program_id', programId)
        .single();

    if (!program) return null;

    // Get latest application info
    const { data: application } = await supabase
        .from('program_applications')
        .select('*')
        .eq('program_id', programId)
        .order('admission_year', { ascending: false })
        .limit(1)
        .maybeSingle();

    return {
        school_name: (program.schools as any)?.name || '',
        program_name: program.name,
        degree: program.degree,
        admission_type: application?.admission_type || null,
        admission_year: application?.admission_year || null,
        apply_start_date: application?.apply_start_date || null,
        apply_end_date: application?.apply_end_date || null,
        result_announce_date: application?.result_announce_date || null,
        application_fee: application?.application_fee || null,
        interview_required: application?.interview_required ?? null,
        written_exam_required: application?.written_exam_required ?? null,
        portfolio_required: application?.portfolio_required ?? null,
        required_documents: application?.required_documents || null,
        source_url: application?.source_url || null,
        data_status: application?.data_status || 'unknown',
        verified_at: application?.verified_at || null,
        // programs 新欄位
        cohort_size: program.cohort_size || null,
        program_overview: program.program_overview || null,
        curriculum_url: program.curriculum_url || null,
        website: program.website || null,
        research_areas: program.research_areas || [],
        faculty_url: program.faculty_url || null,
        labs_url: program.labs_url || null,
        program_id: programId,
        qs_rank: (program.schools as any)?.qs_rank || null,
        city: (program.schools as any)?.city || null,
    };
}

/**
 * Log search query for analytics
 */
export async function logSearch(
    userId: string | null,
    query: string,
    parsed: ParsedQuery,
    resultsCount: number
): Promise<void> {
    try {
        // Find internal user_id from line_user_id
        let internalUserId: string | null = null;
        if (userId) {
            const { data: user } = await supabase
                .from('users')
                .select('user_id')
                .eq('line_user_id', userId)
                .single();
            internalUserId = user?.user_id || null;
        }

        await supabase.from('search_logs').insert({
            user_id: internalUserId,
            query,
            parsed_school: parsed.schoolName,
            parsed_program: parsed.programName,
            results_count: resultsCount,
        });
    } catch (err) {
        console.error('Failed to log search:', err);
    }
}
