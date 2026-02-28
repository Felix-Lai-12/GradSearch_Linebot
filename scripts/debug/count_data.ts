import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const { count: schoolCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

    const { count: programCount } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true });

    const { count: schoolAliasCount } = await supabase
        .from('school_aliases')
        .select('*', { count: 'exact', head: true });

    const { count: programAliasCount } = await supabase
        .from('program_aliases')
        .select('*', { count: 'exact', head: true });

    console.log(`📋 資料庫現況統計：`);
    console.log(`- 🏫 學校數量: ${schoolCount}`);
    console.log(`- 📚 研究所數量: ${programCount}`);
    console.log(`- 🔍 學校別名(Aliases): ${schoolAliasCount}`);
    console.log(`- 🏷️  研究所別名(Aliases): ${programAliasCount}`);
}
main().catch(console.error);
