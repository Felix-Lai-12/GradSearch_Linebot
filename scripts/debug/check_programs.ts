import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const ntuId = '45c3d6b1-caea-4f00-a366-308b77818d84';
    const { data: programs } = await supabase.from('programs').select('*').eq('school_id', ntuId).ilike('name', '%政治%');
    console.log('NTU Politics Programs:', programs);
    
    if (programs && programs.length) {
        const { data: aliases } = await supabase.from('program_aliases').select('*').eq('program_id', programs[0].program_id);
        console.log('NTU Politics Aliases:', aliases);
    }

    const { data: lawPrograms } = await supabase.from('programs').select('*').eq('school_id', ntuId).ilike('name', '%法律%');
    console.log('NTU Law Programs:', lawPrograms);
}
main().catch(console.error);
