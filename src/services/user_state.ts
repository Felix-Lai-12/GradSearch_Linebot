import { supabase } from '../db/supabase';

// State types
export type UserState = 'SEARCH' | 'AI_CHAT';

export async function getUserState(userId: string): Promise<UserState> {
    const { data: record, error } = await supabase
        .from('user_states')
        .select('current_state')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user state:', error);
    }

    if (!record) {
        return 'SEARCH';
    }

    return record.current_state as UserState;
}

export async function setUserState(userId: string, state: UserState): Promise<void> {
    const { error } = await supabase
        .from('user_states')
        .upsert({
            user_id: userId,
            current_state: state,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error setting user state:', error);
    }
}
