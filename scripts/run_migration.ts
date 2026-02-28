import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function runMigration(): Promise<void> {
    // Supabase direct Postgres connection
    // Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.log('⚠ DATABASE_URL not found in .env');
        console.log('');
        console.log('Please add your Supabase Postgres connection string to .env:');
        console.log('DATABASE_URL=postgresql://postgres.doswtaoepsiakxypdepb:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
        console.log('');
        console.log('You can find it in: Supabase Dashboard → Settings → Database → Connection string → URI');
        console.log('');
        console.log('Alternatively, copy the SQL files and run them manually in the Supabase SQL Editor:');
        console.log('  1. Go to: https://supabase.com/dashboard/project/doswtaoepsiakxypdepb/sql/new');
        console.log('  2. Paste the content of: src/db/migrations/001_create_tables.sql');
        console.log('  3. Click "Run"');
        console.log('  4. Then paste and run: src/db/migrations/002_seed_sample_data.sql');
        process.exit(1);
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase Postgres\n');

        const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migration file(s):\n`);

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            console.log(`▶ Running: ${file}`);

            try {
                await client.query(sql);
                console.log(`  ✅ ${file} completed\n`);
            } catch (err: any) {
                console.error(`  ❌ ${file} failed: ${err.message}\n`);
                throw err;
            }
        }

        console.log('🎉 All migrations completed successfully!');
    } finally {
        await client.end();
    }
}

runMigration().catch((err: Error) => {
    console.error('\nMigration failed:', err.message);
    process.exit(1);
});
