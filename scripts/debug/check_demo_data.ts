import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const { data: schools } = await supabase.from('schools').select('*').eq('school_id', 'a0000000-0000-0000-0000-000000000000');
    console.log('Schools:', schools);

    const { data: aliases } = await supabase.from('school_aliases').select('*').eq('school_id', 'a0000000-0000-0000-0000-000000000000');
    console.log('Aliases:', aliases);
}
main().catch(console.error);
