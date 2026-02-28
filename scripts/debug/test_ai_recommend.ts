import { getRecommendations } from '../../src/services/ai_recommendation';
import { supabase } from '../../src/db/supabase';

async function test() {
    const userId = 'test_cli_user_' + Date.now();
    console.log(`Testing AI recommend for ${userId}...\n`);
    
    // Attempt 1
    try {
        console.log('--- Test Query 1 ---');
        console.log('Query: 我是私立大學資管系，想要考好找工作的國立大學所');
        const res1 = await getRecommendations(userId, '我是私立大學資管系，想要考好找工作的國立大學所');
        console.log('Recommendation Result:');
        console.log(JSON.stringify(res1, null, 2));
    } catch (err: any) {
        console.error('Failed 1:', err.message);
    }

    console.log('\n--- Checking user quota via DB ---');
    const { data } = await supabase.from('user_quotas').select('*').eq('user_id', userId).single();
    console.log(data);

}

test();
