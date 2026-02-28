import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🌱 開始建立測試專用資料 (Demo Data)...');

    const testSchoolId = 'a0000000-0000-0000-0000-000000000000';
    const testProgramId = 'b0000000-0000-0000-0000-000000000000';

    // 1. Insert School
    console.log('1. 寫入 schools...');
    await supabase.from('schools').upsert([
        {
            school_id: testSchoolId,
            country: 'TW',
            name: '測試大學',
            short_name: '測大',
            city: '測試市',
            website: 'https://www.test.edu.tw',
            public_private: '公立',
            rank_taiwan: 999
        }
    ]);

    // 2. Insert School Aliases
    console.log('2. 寫入 school_aliases...');
    await supabase.from('school_aliases').delete().eq('school_id', testSchoolId);
    await supabase.from('school_aliases').insert([
        { school_id: testSchoolId, alias: '測大' },
        { school_id: testSchoolId, alias: '測試' },
        { school_id: testSchoolId, alias: '測試大學' }
    ]);

    // 3. Insert Program (Filled with realistic NTU CSIE mock data)
    console.log('3. 寫入 programs...');
    await supabase.from('programs').upsert([
        {
            program_id: testProgramId,
            school_id: testSchoolId,
            country: 'TW',
            name: '測試資訊工程學系',
            degree: ['碩士'],
            department: '資訊工程學系',
            discipline: 'CS',
            website: 'https://www.csie.ntu.edu.tw/',
            language: '中文/英文',
            thesis_required: true,
            cohort_size: 112,
            program_overview: '臺大資訊工程學系旨在培育具備扎實資訊理論基礎與實務系統開發能力的高階研發人才，涵蓋人工智慧、計算機系統、網路及多媒體等前瞻領域。',
            curriculum_url: 'https://www.csie.ntu.edu.tw/curriculum/',
            research_areas: ['人工智慧', '計算機系統', '計算機網路', '軟體工程', '多媒體系統'],
            faculty_url: 'https://www.csie.ntu.edu.tw/faculty/',
            labs_url: 'https://www.csie.ntu.edu.tw/research/'
        }
    ]);

    // 4. Insert Program Aliases
    console.log('4. 寫入 program_aliases...');
    await supabase.from('program_aliases').delete().eq('program_id', testProgramId);
    await supabase.from('program_aliases').insert([
        { program_id: testProgramId, alias: '資工所' },
        { program_id: testProgramId, alias: '資工' }
    ]);

    // 5. Insert Program Application
    console.log('5. 寫入 program_applications...');
    await supabase.from('program_applications').upsert([
        {
            program_id: testProgramId,
            admission_type: '甄試',
            admission_year: 115,
            apply_start_date: '2025-10-01',
            apply_end_date: '2025-10-15',
            result_announce_date: '2025-11-20',
            application_fee: 1500,
            required_documents: { sop: true, recommendation_letters: 2, transcript: true, resume: true, portfolio: false },
            interview_required: true,
            written_exam_required: false,
            portfolio_required: false,
            tests_required: '無',
            source_url: 'https://www.csie.ntu.edu.tw/admissions',
            data_status: 'active',
            confidence: 5,
            verified_at: new Date().toISOString()
        }
    ]);

    console.log('✅ 測試資料建置完成！');
}

main().catch(console.error);
