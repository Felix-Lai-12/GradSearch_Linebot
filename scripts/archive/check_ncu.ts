import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkNCU() {
  const { data } = await supabase
    .from('programs')
    .select('program_id, name, website, curriculum_url')
    .ilike('name', '%中央%企%')
    .limit(3);

  data?.forEach(p => {
    console.log('\n---');
    console.log('Program:', p.name);
    console.log('Website:', p.website);
    console.log('Curriculum:', p.curriculum_url);
  });
}

checkNCU();
