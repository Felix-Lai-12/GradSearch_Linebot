import 'dotenv/config';
import { processBugReport } from '../../src/services/ai_bug_fixer';

async function runTests() {
    console.log('--- Test 1: Alias Add (Success expected) ---');
    const res1 = await processBugReport('我輸入交大資工竟然查不到，應該是指國立陽明交通大學吧');
    console.log(JSON.stringify(res1, null, 2));

    console.log('\n--- Test 2: Unknown / Not Fixable (Fail expected) ---');
    const res2 = await processBugReport('研究所好難考喔，系統壞了');
    console.log(JSON.stringify(res2, null, 2));

    console.log('\n--- Test 3: URL Update (Success expected) ---');
    const res3 = await processBugReport('為什麼台大中文所的官網連結是：https://www.ntu-ccms.ntu.edu.tw/，應該是 https://www.cl.ntu.edu.tw/home.jsp');
    console.log(JSON.stringify(res3, null, 2));

    console.log('\n--- Test 4: URL Update Missing Program (Fail expected) ---');
    const res4 = await processBugReport('台大某個系的官網連結錯了，應該是 https://www.ntu.edu.tw');
    console.log(JSON.stringify(res4, null, 2));
}

runTests();
