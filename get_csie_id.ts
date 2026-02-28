import { supabase } from './src/db/supabase';

async function main() {
    const { data } = await supabase
        .from('programs')
        .select('program_id')
        .eq('name', '資訊工程學系')
        .is('program_overview', null)
        .limit(5);
    console.log(data);
}
main();
