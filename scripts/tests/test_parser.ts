import dotenv from 'dotenv';
dotenv.config();
import { parseKeyword } from '../src/parsers/keyword';

async function main() {
    const res = await parseKeyword('測試資工所');
    console.log('[測試資工所] ->', JSON.stringify(res, null, 2));
}

main().catch(console.error);
