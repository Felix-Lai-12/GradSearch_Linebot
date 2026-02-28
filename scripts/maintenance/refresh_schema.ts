import { supabase } from '../../src/db/supabase';

async function refreshSchema() {
    console.log('🔄 Attempting to refresh Supabase schema cache...');
    const { error: addError } = await supabase.rpc('run_sql', {
        sql: 'ALTER TABLE program_applications ADD COLUMN IF NOT EXISTS _temp_refresh TEXT;'
    });

    // If RPC is not enabled, we might need another way or just wait.
    // Usually, simply hitting the API after a few minutes works, 
    // but sometimes an explicit structure change helps.

    if (addError) {
        console.error('❌ RPC run_sql failed (likely not enabled):', addError);
        console.log('💡 Tip: Go to Supabase Dashboard > SQL Editor and run: ALTER TABLE program_applications ADD COLUMN _temp TEXT; ALTER TABLE program_applications DROP COLUMN _temp;');
    } else {
        await supabase.rpc('run_sql', { sql: 'ALTER TABLE program_applications DROP COLUMN _temp_refresh;' });
        console.log('✅ Schema refresh triggered via RPC.');
    }
}

refreshSchema();
