import { supabase } from '../../src/db/supabase';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * 115 學年度研究所推甄時程資料 (基於 ReallyGood 總整理)
 * 轉化為程式可處理的格式。
 * 規則：同一校系所有系所適用相同日期。
 */
const schoolSchedules = [
    {
        school_name: '國立臺灣大學',
        apply_start_date: '114/10/02',
        apply_end_date: '114/10/09',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/20',
        brochure_url: 'https://exam.aca.ntu.edu.tw/graf/brochure/detail.asp'
    },
    {
        school_name: '國立清華大學',
        apply_start_date: '114/10/08',
        apply_end_date: '114/10/14',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/15',
        brochure_url: 'https://admissions.nthu.edu.tw/p/406-1032-273523,r1155.php'
    },
    {
        school_name: '國立陽明交通大學',
        apply_start_date: '114/10/01',
        apply_end_date: '114/10/07',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/18',
        brochure_url: 'https://exam.nycu.edu.tw/115md/'
    },
    {
        school_name: '國立成功大學',
        apply_start_date: '114/09/24',
        apply_end_date: '114/10/02',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/21',
        brochure_url: 'https://adms-acad.ncku.edu.tw/p/406-1044-271512,r3544.php'
    },
    {
        school_name: '國立政治大學',
        apply_start_date: '114/10/01',
        apply_end_date: '114/10/08',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/25',
        brochure_url: 'https://www.nccu.edu.tw/p/406-1000-17684,r123.php'
    },
    {
        school_name: '私立東吳大學',
        apply_start_date: '114/10/13',
        apply_end_date: '114/10/27',
        interview_dates: '114/11/10-114/11/22',
        first_result_announce_date: '114/11/29',
        brochure_url: 'https://www.scu.edu.tw/'
    },
    {
        school_name: '國立臺灣科技大學',
        apply_start_date: '114/09/25',
        apply_end_date: '114/10/02',
        interview_dates: '114/11/07-114/11/09',
        first_result_announce_date: '114/11/03',
        second_result_announce_date: '114/11/26',
        brochure_url: 'https://www.admission.ntust.edu.tw/'
    },
    {
        school_name: '國立勤益科技大學',
        apply_start_date: '114/10/15',
        apply_end_date: '114/11/10',
        interview_dates: '114/11/22',
        first_result_announce_date: '114/11/20',
        second_result_announce_date: '114/12/10',
        brochure_url: 'https://drive.google.com/file/d/1E2dJVsX56Lp4SIC89YA3N8KlolDd7AKi/view?usp=drive_link'
    },
    {
        school_name: '國立中央大學',
        apply_start_date: '114/09/30',
        apply_end_date: '114/10/07',
        interview_dates: '114/10-114/11',
        first_result_announce_date: '114/11/07',
        second_result_announce_date: '114/11/21',
        brochure_url: 'https://admission.ncu.edu.tw/files/system/files/57143/%E7%94%84%E8%A9%A6%E7%B0%A1%E7%AB%A0/%E5%85%B1%E5%90%8C/00-115%E7%A2%A9%E5%8D%9A%E7%94%84%E8%A9%A6%E7%B0%A1%E7%AB%A0.pdf'
    },
    {
        school_name: '元智大學',
        apply_start_date: '114/10/15',
        apply_end_date: '114/10/29',
        interview_dates: '114/11',
        first_result_announce_date: '114/11/28',
        brochure_url: 'https://www.yzu.edu.tw/admissions/files/AA/aplexam/115%E7%A2%A9%E5%8D%9A%E5%A3%AB%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E7%B0%A1%E7%AB%A0.pdf'
    },
];

async function updateApplicationsManually() {
    console.log('🚀 Starting Manual Program Application Update...');

    for (const schedule of schoolSchedules) {
        console.log(`🔍 Processing ${schedule.school_name}...`);

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

        // Get programs for this school
        const { data: programs } = await supabase
            .from('programs')
            .select('program_id, name')
            .eq('school_id', schoolId);

        if (!programs || programs.length === 0) {
            console.warn(`⚠️ No programs found for ${schedule.school_name}`);
            continue;
        }

        console.log(`📝 Updating ${programs.length} programs for ${schedule.school_name}...`);

        for (const program of programs) {
            const { error } = await supabase
                .from('program_applications')
                .upsert({
                    program_id: program.program_id,
                    admission_type: '甄試',
                    admission_year: 115,
                    apply_start_date: parseDate(schedule.apply_start_date),
                    apply_end_date: parseDate(schedule.apply_end_date),
                    interview_required: !!schedule.interview_dates,
                    first_result_announce_date: parseDate(schedule.first_result_announce_date),
                    second_result_announce_date: parseDate(schedule.second_result_announce_date),
                    source_url: schedule.brochure_url,
                    last_updated: new Date().toISOString()
                }, {
                    onConflict: 'program_id,admission_type,admission_year'
                });

            if (error) {
                // If it fails because of missing columns, it's expected until migration runs
                console.error(`❌ Update failed for ${program.name}: ${error.message}`);
                if (error.message.includes('column')) {
                    console.error('🛑 Stopping: Please run the SQL migration first!');
                    return;
                }
            }
        }
    }

    console.log('✅ Manual update process finished.');
}

function parseDate(rocDate: string | undefined): string | null {
    if (!rocDate) return null;
    const match = rocDate.match(/(\d{3})\/(\d{2})\/(\d{2})/);
    if (match) {
        const year = parseInt(match[1]) + 1911;
        return `${year}-${match[2]}-${match[3]}`;
    }
    return null;
}

updateApplicationsManually();
