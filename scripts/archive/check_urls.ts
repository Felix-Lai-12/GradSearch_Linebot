import { supabase } from './src/db/supabase';

async function main() {
    const { count, error } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .like('website', '%udb.moe.edu.tw%');
    console.log("Programs with udb.moe.edu.tw URLs:", count);
}
main();
