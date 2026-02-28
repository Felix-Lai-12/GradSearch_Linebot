import dotenv from 'dotenv';
dotenv.config();
import { searchProgram } from '../src/services/search';

async function main() {
    const query = process.argv[2] || '測試資工';
    const res = await searchProgram(query);
    if (res.type === 'found' && res.result) {
        console.log(`[${query}] payload ->`, JSON.stringify(res.result, null, 2));
    } else {
        console.log(`[${query}] -> result:`, res);
    }
}

main().catch(console.error);
