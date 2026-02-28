import { supabase } from './src/db/supabase';

async function main() {
    const { data } = await supabase
        .from('schools')
        .select('name, rank_taiwan')
        .order('rank_taiwan', { ascending: true })
        .limit(20);
    console.log(data);
}
main();
