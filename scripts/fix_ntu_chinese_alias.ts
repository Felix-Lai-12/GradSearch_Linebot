import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function fixNtuChineseAlias() {
    console.log('🔧 Fixing Ntu中文 alias...\n');

    // 1. Delete incorrect alias
    console.log('1. Deleting incorrect "Ntu中文" alias...');
    const { error: deleteError } = await supabase
        .from('program_aliases')
        .delete()
        .eq('alias', 'Ntu中文');

    if (deleteError) {
        console.error('❌ Failed to delete:', deleteError);
    } else {
        console.log('✅ Deleted "Ntu中文" alias');
    }

    // 2. Find 台大中文系
    console.log('\n2. Finding 台大中國文學系...');
    const { data: programs } = await supabase
        .from('programs')
        .select('program_id, name, school_id, schools!inner(name)')
        .ilike('schools.name', '%臺灣大學%')
        .ilike('name', '%中國文學%')
        .limit(1);

    if (!programs || programs.length === 0) {
        console.error('❌ Cannot find 台大中國文學系');
        return;
    }

    const program = programs[0];
    const schoolName = (program as any).schools?.name || 'Unknown';
    console.log(`✅ Found: ${schoolName} - ${program.name}`);

    // 3. Check if "中文" alias already exists
    console.log('\n3. Checking if "中文" alias exists...');
    const { data: existing } = await supabase
        .from('program_aliases')
        .select('*')
        .eq('program_id', program.program_id)
        .eq('alias', '中文')
        .single();

    if (existing) {
        console.log('ℹ️  "中文" alias already exists, skipping insert');
    } else {
        // 4. Insert correct alias
        console.log('4. Inserting "中文" alias...');
        const { error: insertError } = await supabase
            .from('program_aliases')
            .insert({
                program_id: program.program_id,
                alias: '中文'
            });

        if (insertError) {
            console.error('❌ Failed to insert:', insertError);
        } else {
            console.log('✅ Inserted "中文" alias');
        }
    }

    // 5. Verify
    console.log('\n5. Verifying aliases...');
    const { data: aliases } = await supabase
        .from('program_aliases')
        .select('alias, programs(name, schools(name))')
        .eq('program_id', program.program_id)
        .in('alias', ['中文', 'Ntu中文']);

    console.log('\nCurrent aliases for 台大中國文學系:');
    if (aliases && aliases.length > 0) {
        aliases.forEach(a => {
            console.log(`  - ${a.alias}`);
        });
    } else {
        console.log('  (none found)');
    }

    console.log('\n✅ Fix completed!');
    console.log('\nNow "Ntu中文" should work:');
    console.log('  - "Ntu" → 國立臺灣大學 (school alias)');
    console.log('  - "中文" → 中國文學系 (program alias)');
}

fixNtuChineseAlias().catch(console.error);
