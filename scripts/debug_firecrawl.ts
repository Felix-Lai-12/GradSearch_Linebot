import dotenv from 'dotenv';
dotenv.config();
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

async function debug() {
    console.log('Scraping 041...');
    const result = await firecrawl.scrape('https://udb.moe.edu.tw/ulist/ISCED/041', {
        formats: ['markdown'],
    }) as any;

    const md = result.markdown as string;
    const lines = md.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('000021E67173')) {
            console.log('--- FOUND DEPARTMENT LINK ---');
            for (let j = Math.max(0, i - 1); j < Math.min(lines.length, i + 5); j++) {
                console.log(`[${j}] ${lines[j]}`);
            }
            console.log('-----------------------------');
            break;
        }
    }
}

debug().catch(console.error);
