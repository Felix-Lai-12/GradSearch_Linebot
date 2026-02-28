import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkBadUrl() {
  const { data } = await supabase
    .from('programs')
    .select('name, website')
    .ilike('name', '%企業管理%')
    .limit(1)
    .single();

  console.log('Program:', data?.name);
  console.log('Website:', data?.website);
  console.log('Length:', data?.website?.length);
  console.log('Has space:', /\s/.test(data?.website || ''));
}

checkBadUrl();
