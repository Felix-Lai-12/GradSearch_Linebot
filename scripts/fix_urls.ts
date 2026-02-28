import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fixUrls() {
  // 取得所有有 website 或 curriculum_url 的 programs
  const { data: programs, error } = await supabase
    .from('programs')
    .select('program_id, name, website, curriculum_url, faculty_url, labs_url')
    .or('website.not.is.null,curriculum_url.not.is.null,faculty_url.not.is.null,labs_url.not.is.null');

  if (error) {
    console.error('Error fetching programs:', error);
    return;
  }

  console.log(`Found ${programs.length} programs with URLs`);

  const updates = [];
  let issueCount = 0;

  for (const program of programs) {
    let needsUpdate = false;
    const update: any = { program_id: program.program_id };

    // 檢查並清理每個 URL 欄位
    const urlFields: Array<keyof typeof program> = ['website', 'curriculum_url', 'faculty_url', 'labs_url'];
    
    for (const field of urlFields) {
      const url = program[field] as string | null;
      if (url && typeof url === 'string') {
        // 檢查是否有問題（包含空白、中文、特殊字元）
        if (/[\s"\\]|[^\x00-\x7F]/.test(url)) {
          issueCount++;
          console.log(`\n❌ Issue found in ${program.name}`);
          console.log(`   Field: ${field}`);
          console.log(`   Original: ${url.substring(0, 100)}...`);
          
          // 清理 URL
          let cleanUrl = url.trim().split(/\s/)[0];
          cleanUrl = cleanUrl.replace(/["\\\s]/g, '');
          
          console.log(`   Cleaned:  ${cleanUrl.substring(0, 100)}...`);
          
          update[field] = cleanUrl;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      updates.push(update);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total programs checked: ${programs.length}`);
  console.log(`   Programs with issues: ${updates.length}`);
  console.log(`   Total URL issues found: ${issueCount}`);

  if (updates.length > 0) {
    console.log(`\n🔧 Updating ${updates.length} programs...`);
    
    // 批次更新
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('programs')
        .update(update)
        .eq('program_id', update.program_id);

      if (updateError) {
        console.error(`Error updating program ${update.program_id}:`, updateError);
      }
    }

    console.log('✅ All URLs fixed!');
  } else {
    console.log('\n✅ No issues found!');
  }
}

fixUrls();
