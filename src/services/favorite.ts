import { supabase } from '../db/supabase';

/**
 * Add or remove a program from user's favorites
 * Returns true if added, false if removed
 */
export async function toggleFavorite(lineUserId: string, programId: string): Promise<boolean> {
    // 1. Ensure user exists in our DB
    let { data: user } = await supabase
        .from('users')
        .select('user_id')
        .eq('line_user_id', lineUserId)
        .single();

    if (!user) {
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ line_user_id: lineUserId }])
            .select()
            .single();

        if (createError || !newUser) throw new Error('Failed to create/get user');
        user = newUser;
    }

    if (!user) throw new Error('User still null after creation');

    // 2. Check if already exists
    const { data: existing } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('program_id', programId)
        .maybeSingle();

    if (existing) {
        // Remove it
        await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', user.user_id)
            .eq('program_id', programId);
        return false;
    } else {
        // Add it
        await supabase
            .from('user_favorites')
            .insert([{
                user_id: user.user_id,
                program_id: programId
            }]);
        return true;
    }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(lineUserId: string) {
    const { data: user } = await supabase
        .from('users')
        .select('user_id')
        .eq('line_user_id', lineUserId)
        .single();

    if (!user) return [];

    const { data, error } = await supabase
        .from('user_favorites')
        .select(`
            program_id,
            programs (
                name,
                degree,
                schools (
                    name,
                    qs_rank
                )
            )
        `)
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }

    return data.map((f: any) => ({
        program_id: f.program_id,
        program_name: f.programs.name,
        degree: f.programs.degree,
        school_name: f.programs.schools.name,
        qs_rank: f.programs.schools.qs_rank
    }));
}
