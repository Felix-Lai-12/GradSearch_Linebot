import { supabase } from '../../src/db/supabase';
import FirecrawlApp from '@mendable/firecrawl-js';
import * as dotenv from 'dotenv';

dotenv.config();

const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY || '',
});

const TARGET_URL = 'https://www.reallygood.com.tw/newExam/inside?str=C839127A8222532F37B9B52B8B075673&print_id=19621';

async function scrapeApplications() {
    console.log('🚀 Starting Program Application Scraping from ReallyGood...');

    try {
        // 1. Use Firecrawl Extract to get university-level dates
        console.log('📥 Extracting school-level admission dates...');
        const extractResult = await firecrawl.extract({
            urls: [TARGET_URL],
            prompt: `Extract a list of university admission schedules for the 115th academic year (115學年度研究所推甄). 
            For each university, identify:
            - school_name (e.g., 國立臺灣大學)
            - registration_start (e.g., 114/10/02)
            - registration_end (e.g., 114/10/09)
            - interview_dates (e.g., 114/11/01)
            - release_date (e.g., 114/11/20)
            - brochure_pdf_url`,
            schema: {
                type: 'object',
                properties: {
                    schedules: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                school_name: { type: 'string' },
                                registration_start: { type: 'string' },
                                registration_end: { type: 'string' },
                                interview_dates: { type: 'string' },
                                release_date: { type: 'string' },
                                brochure_pdf_url: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        if (!extractResult.success) {
            throw new Error(`Firecrawl extraction failed: ${extractResult.error}`);
        }

        const schedules = (extractResult.data as any).schedules;
        console.log(`✅ Extracted schedules for ${schedules.length} schools.`);

        // 2. Process and Upsert into Supabase
        for (const schedule of schedules) {
            console.log(`🔍 Processing ${schedule.school_name}...`);

            // Find school in DB
            const { data: schools } = await supabase
                .from('schools')
                .select('school_id')
                .ilike('name', `%${schedule.school_name}%`)
                .limit(1);

            if (!schools || schools.length === 0) {
                console.warn(`⚠️ School not found in DB: ${schedule.school_name}`);
                continue;
            }

            const schoolId = schools[0].school_id;

            // Get all programs for this school
            const { data: programs } = await supabase
                .from('programs')
                .select('program_id, name')
                .eq('school_id', schoolId);

            if (!programs || programs.length === 0) {
                console.warn(`⚠️ No programs found for ${schedule.school_name}`);
                continue;
            }

            // Update program_applications for each program
            // For MVP, we apply the university-level dates to all internal programs
            for (const program of programs) {
                const deadlineDate = parseDate(schedule.registration_end);

                const { error: upsertError } = await supabase
                    .from('program_applications')
                    .upsert({
                        program_id: program.program_id,
                        admission_type: '甄試',
                        admission_year: 115,
                        deadline: deadlineDate,
                        interview_required: !!schedule.interview_dates,
                        source_url: schedule.brochure_pdf_url || TARGET_URL,
                        last_updated: new Date().toISOString()
                    }, {
                        onConflict: 'program_id,admission_type,admission_year'
                    });

                if (upsertError) {
                    console.error(`❌ Error upserting ${program.name}:`, upsertError);
                }
            }
        }

        console.log('🎊 Scraping and integration completed!');

    } catch (error) {
        console.error('💥 Scraping process failed:', error);
    }
}

/**
 * Helper to convert 114/10/02 to YYYY-MM-DD
 */
function parseDate(rocDate: string | undefined): string | null {
    if (!rocDate) return null;
    const match = rocDate.match(/(\d{3})\/(\d{2})\/(\d{2})/);
    if (match) {
        const year = parseInt(match[1]) + 1911;
        return `${year}-${match[2]}-${match[3]}`;
    }
    return null;
}

scrapeApplications();
