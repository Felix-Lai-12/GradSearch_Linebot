import { supabase } from '../src/db/supabase';
import dotenv from 'dotenv';
dotenv.config();

const RANKINGS_AND_CITIES: Record<string, { qs_rank: string; city: string }> = {
    // QS World University Rankings 2025 (Taiwan)
    '國立臺灣大學': { qs_rank: '63', city: '台北市' },
    '國立清華大學': { qs_rank: '176', city: '新竹市' },
    '國立陽明交通大學': { qs_rank: '199', city: '新竹市' },
    '國立成功大學': { qs_rank: '203', city: '台南市' },
    '國立臺灣科技大學': { qs_rank: '345', city: '台北市' },
    '國立臺北科技大學': { qs_rank: '420', city: '台北市' },
    '國立臺灣師範大學': { qs_rank: '435', city: '台北市' },
    '國立中山大學': { qs_rank: '439', city: '高雄市' },
    '國立中央大學': { qs_rank: '587', city: '桃園市' },
    '臺北醫學大學': { qs_rank: '597', city: '台北市' },
    '國立政治大學': { qs_rank: '604', city: '台北市' },
    '國立中興大學': { qs_rank: '628', city: '台中市' },
    '長庚大學': { qs_rank: '668', city: '桃園市' },
    '亞洲大學': { qs_rank: '711-720', city: '台中市' },
    '國立中正大學': { qs_rank: '951-1000', city: '嘉義縣' },
    '中原大學': { qs_rank: '1001-1200', city: '桃園市' },
    '元智大學': { qs_rank: '1001-1200', city: '桃園市' },
    '長榮大學': { qs_rank: '1201-1400', city: '台南市' },
    '逢甲大學': { qs_rank: '1201-1400', city: '台中市' },
    '輔仁大學': { qs_rank: '1201-1400', city: '新北市' },
    '國立勤益科技大學': { qs_rank: '1201-1400', city: '台中市' },
    '國立東華大學': { qs_rank: '1201-1400', city: '花蓮縣' },
    '國立台灣海洋大學': { qs_rank: '1201-1400', city: '基隆市' },
    '國立臺灣海洋大學': { qs_rank: '1201-1400', city: '基隆市' }, // Alis
    '淡江大學': { qs_rank: '1201-1400', city: '新北市' },
    '東海大學': { qs_rank: '1201-1400', city: '台中市' },
    '朝陽科技大學': { qs_rank: '1400+', city: '台中市' },
    '國立臺北大學': { qs_rank: '1400+', city: '新北市' },
};

async function main() {
    console.log('🏫 開始為學校補上 QS World rankings (qs_rank) 及城市資料...');

    const { data: schools, error: fetchError } = await supabase.from('schools').select('school_id, name');

    if (fetchError || !schools) {
        console.error('Failed to fetch schools', fetchError);
        return;
    }

    let updatedCount = 0;

    for (const school of schools) {
        let updates: any = {};

        // 嘗試找出預設的城市和排名
        const info = RANKINGS_AND_CITIES[school.name];

        if (info) {
            updates.qs_rank = info.qs_rank;
            updates.city = info.city;
        } else {
            // 清除本來可能是亂數的排名
            updates.qs_rank = null;

            // 如果不在 mapping 中，嘗試用字串推斷城市
            const n = school.name;
            if (n.includes('臺北') || n.includes('台北') || n.includes('中國科技大學') || n.includes('德明') || n.includes('康寧') || n.includes('中華科') || n.includes('馬偕醫護') || n.includes('臺灣戲曲') || n.includes('中國文化') || n.includes('台神') || n.includes('浸會神學院')) updates.city = '台北市';
            else if (n.includes('新北') || n.includes('淡江') || n.includes('華梵') || n.includes('真理') || n.includes('明志') || n.includes('聖約翰') || n.includes('景文') || n.includes('東南') || n.includes('醒吾') || n.includes('致理') || n.includes('宏國') || n.includes('亞東') || n.includes('馬偕醫學大學') || n.includes('黎明') || n.includes('耕莘') || n.includes('空中大學') || n.includes('法鼓') || n.includes('藝術大學') || n.includes('輔仁大學學校財團法人')) updates.city = '新北市';
            else if (n.includes('桃園') || n.includes('體育大學') || n.includes('龍華') || n.includes('健行') || n.includes('萬能') || n.includes('開南') || n.includes('長庚科技') || n.includes('南亞') || n.includes('新生') || n.includes('中華福音神學')) updates.city = '桃園市';
            else if (n.includes('新竹市') || n.includes('玄奘') || n.includes('中華大學學校財團法人') || n.includes('元培')) updates.city = '新竹市';
            else if (n.includes('新竹') || n.includes('明新') || n.includes('大華') || n.includes('敏實')) updates.city = '新竹縣';
            else if (n.includes('苗栗') || n.includes('育達') || n.includes('仁德')) updates.city = '苗栗縣';
            else if (n.includes('臺中') || n.includes('台中') || n.includes('臺灣體育') || n.includes('靜宜') || n.includes('弘光') || n.includes('嶺東') || n.includes('中臺') || n.includes('僑光') || n.includes('修平')) updates.city = '台中市';
            else if (n.includes('彰化') || n.includes('建國科') || n.includes('大葉')) updates.city = '彰化縣';
            else if (n.includes('南投') || n.includes('南開') || n.includes('一貫道崇德') || n.includes('唯心聖教')) updates.city = '南投縣';
            else if (n.includes('雲林') || n.includes('福智')) updates.city = '雲林縣';
            else if (n.includes('嘉義市') || n.includes('崇仁')) updates.city = '嘉義市';
            else if (n.includes('嘉義') || n.includes('吳鳳') || n.includes('南華')) updates.city = '嘉義縣';
            else if (n.includes('臺南') || n.includes('台南') || n.includes('南臺') || n.includes('崑山') || n.includes('中信金') || n.includes('中信科技') || n.includes('中信金融') || n.includes('南神') || n.includes('敏惠') || n.includes('嘉南藥理') || n.includes('中華醫事')) updates.city = '台南市';
            else if (n.includes('高雄') || n.includes('輔英') || n.includes('義守') || n.includes('樹德') || n.includes('正修') || n.includes('台鋼') || n.includes('文藻') || n.includes('樹人') || n.includes('育英')) updates.city = '高雄市';
            else if (n.includes('屏東') || n.includes('大仁') || n.includes('美和') || n.includes('慈惠')) updates.city = '屏東縣';
            else if (n.includes('宜蘭') || n.includes('佛光') || n.includes('聖母')) updates.city = '宜蘭縣';
            else if (n.includes('花蓮') || n.includes('慈濟學校財團法人')) updates.city = '花蓮縣';
            else if (n.includes('臺東') || n.includes('台東')) updates.city = '台東縣';
            else if (n.includes('金門')) updates.city = '金門縣';
            else if (n.includes('澎湖')) updates.city = '澎湖縣';
            else if (n.includes('崇右') || n.includes('德育')) updates.city = '基隆市';

            // rank_taiwan 留空 (null)
        }

        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
                .from('schools')
                .update(updates)
                .eq('school_id', school.school_id);

            if (error) {
                console.error(`更新失敗: ${school.name}`, error);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ 成功更新了 ${updatedCount} 所學校的排名與城市資訊！`);
}

main().catch(console.error);
