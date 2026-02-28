import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const { data } = await supabase.from('schools').select('school_id, name').in('name', ['國立臺灣大學', '國立政治大學', '國立成功大學']);
    console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
