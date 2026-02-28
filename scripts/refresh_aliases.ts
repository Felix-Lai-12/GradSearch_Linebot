import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🧹 Clearing all school_aliases and program_aliases...');
    await supabase.from('school_aliases').delete().neq('school_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('program_aliases').delete().neq('program_id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Aliases cleared.');
}
main().catch(console.error);
