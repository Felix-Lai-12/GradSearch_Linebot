import { supabase } from '../../src/db/supabase';

async function setPro(lineUserId: string) {
    console.log(`Setting user ${lineUserId} to 'pro' tier...`);
    
    // First ensure the record exists in user_quotas
    const { data: record } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', lineUserId)
        .single();

    if (!record) {
        console.log("Record not found, creating new 'pro' record...");
        const { error: insError } = await supabase.from('user_quotas').insert({
            user_id: lineUserId,
            tier: 'pro',
            chat_count: 0,
            last_reset_date: new Date().toISOString().split('T')[0]
        });
        if (insError) console.error('Insert error:', insError);
        else console.log('Successfully created pro record.');
    } else {
        const { error: updError } = await supabase
            .from('user_quotas')
            .update({ tier: 'pro' })
            .eq('user_id', lineUserId);
        
        if (updError) console.error('Update error:', updError);
        else console.log('Successfully updated to pro tier.');
    }
}

const arg = process.argv[2];
if (!arg) {
    console.log('Usage: npx ts-node scripts/debug/set_pro_user.ts <LINE_USER_ID>');
} else {
    setPro(arg);
}
