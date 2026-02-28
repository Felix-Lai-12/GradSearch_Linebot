import { supabase } from '../db/supabase';

const MAX_FREE_CHAT = 10;

/**
 * Ensures the user has a state/quota record for today. 
 * If the record is from a previous day, resets the count.
 */
async function initializeUserQuota(userId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: record, error } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
        console.error('Error fetching user quota:', error);
        return false;
    }

    if (!record) {
        // Create new record
        await supabase.from('user_states').insert({
            user_id: userId,
            tier: 'free',
            chat_count: 0,
            last_reset_date: todayStr
        });
        return true;
    } else {
        // Check if we need to reset
        if (record.last_reset_date !== todayStr) {
            await supabase
                .from('user_states')
                .update({ chat_count: 0, last_reset_date: todayStr })
                .eq('user_id', userId);
        }
        return true;
    }
}

/**
 * Checks if the user has enough quota to perform an AI chat.
 * @returns true if allowed, false if limit reached.
 */
export async function checkAndConsumeQuota(userId: string): Promise<boolean> {
    await initializeUserQuota(userId);

    const { data: record } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!record) return false;

    // Tier-based logic
    if (record.tier === 'pro') {
        // 'pro' tier is unlimited
    } else if (record.tier === 'free' && record.chat_count >= MAX_FREE_CHAT) {
        return false;
    }

    // Increment count
    await supabase
        .from('user_states')
        .update({ chat_count: record.chat_count + 1 })
        .eq('user_id', userId);

    return true;
}

/**
 * Gets the current usage for the user.
 */
export async function getUserQuotaStatus(userId: string) {
    await initializeUserQuota(userId);

    const { data: record } = await supabase
        .from('user_states')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!record) return { count: 0, max: MAX_FREE_CHAT, tier: 'free' };

    return {
        count: record.chat_count,
        max: record.tier === 'free' ? MAX_FREE_CHAT : -1, // -1 or Infinity for premium
        tier: record.tier
    };
}
