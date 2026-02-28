import { getRecommendations } from '../../src/services/ai_recommendation';

async function test() {
    const userId = 'test_cli_user_' + Date.now();
    console.log(`Testing AI recommend for ${userId}...\n`);
    
    // Attempt 1: Insufficient Info
    try {
        console.log('--- Test Query 1 (Insufficient Info) ---');
        const q1 = '我不知道要考什麼所';
        console.log('Query:', q1);
        const res1 = await getRecommendations(userId, q1);
        console.log('Response Type:', res1?.response_type);
        console.log('Reply Message:', res1?.reply_message);
        console.log('Recommendations length:', res1?.recommendations?.length);
    } catch (err: any) {
        console.error('Failed 1:', err.message);
    }
    
    console.log('\n');

    // Attempt 2: Sufficient Info
    try {
        console.log('--- Test Query 2 (Sufficient Info) ---');
        const q2 = '我是私立大學資管系，想要考好找工作的國立大學所';
        console.log('Query:', q2);
        const res2 = await getRecommendations(userId, q2);
        console.log('Response Type:', res2?.response_type);
        console.log('Reply Message:', res2?.reply_message);
        console.log('Recommendations length:', res2?.recommendations?.length);
        if (res2?.recommendations) {
            console.log(JSON.stringify(res2.recommendations[0], null, 2));
        }
    } catch (err: any) {
        console.error('Failed 2:', err.message);
    }

}

test();
