import dotenv from 'dotenv';
dotenv.config();
import { supabase } from '../src/db/supabase';

async function verify() {
    const { data: schools } = await supabase.from('schools').select('*').like('name', '%中山%');
    console.log('Schools:', schools);

    if (schools && schools.length) {
        const sId = schools[0].school_id;
        const { data: programs } = await supabase.from('programs').select('name, program_aliases(alias)').eq('school_id', sId);
        console.log('Programs:', JSON.stringify(programs, null, 2));
    }
}
verify().catch(console.error);
