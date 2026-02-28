import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const { data: schools } = await supabase.from('schools').select('*').like('name', '%臺灣大學%');
    console.log('Real NTU:', schools);
    
    if (schools && schools.length) {
        const { data: aliases } = await supabase.from('school_aliases').select('*').eq('school_id', schools[0].school_id);
        console.log('NTU Aliases:', aliases);
    }
    
    console.log('--- checking "政治" alias ---');
    const { data: polAliases } = await supabase.from('school_aliases').select('*, schools(name)').eq('alias', '政治');
    console.log('政治 School Alias:', polAliases);

    console.log('--- checking "台大" alias ---');
    const { data: ntuAliases } = await supabase.from('school_aliases').select('*, schools(name)').eq('alias', '台大');
    console.log('台大 School Alias:', ntuAliases);
}
main().catch(console.error);
