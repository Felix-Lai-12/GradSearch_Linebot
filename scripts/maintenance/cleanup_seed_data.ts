import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🧹 開始清理舊版 002_seed_sample_data.sql 產生的假資料...');

    // We can delete the root schools, which will cascade delete programs, aliases, and applications 
    // IF the cascade rules exist. To be safe, let's delete bottom-up.

    const mockSchoolIds = [
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000003'
    ];

    const mockProgramIds = [
        'b0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000005'
    ];

    console.log('1. 清理 program_applications...');
    await supabase.from('program_applications').delete().in('program_id', mockProgramIds);

    console.log('2. 清理 program_aliases...');
    await supabase.from('program_aliases').delete().in('program_id', mockProgramIds);

    console.log('3. 清理 programs...');
    await supabase.from('programs').delete().in('program_id', mockProgramIds);

    console.log('4. 清理 school_aliases...');
    await supabase.from('school_aliases').delete().in('school_id', mockSchoolIds);

    console.log('5. 清理 schools...');
    await supabase.from('schools').delete().in('school_id', mockSchoolIds);

    console.log('✅ 清理完成！假資料已全部移除。');
}

main().catch(console.error);
