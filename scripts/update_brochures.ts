import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const mappedUrls = [
    { "school": "國立臺灣大學", "url": "https://exam.aca.ntu.edu.tw/graf/brochure/" },
    { "school": "國立清華大學", "url": "https://drive.google.com/file/d/1CPdMZe_7Wi1eabl2G3KVZ1wsoZzUR_Y0/view?usp=drive_link" },
    { "school": "國立陽明交通大學", "url": "https://drive.google.com/file/d/1PH1UIgKGKtju7GwykFVtzgvfngBsuyyN/view?usp=drive_link" },
    { "school": "國立成功大學", "url": "https://drive.google.com/file/d/1iluY-jigV7T4ZiK1WAnGBcmRmnP7-FnY/view?usp=drive_link" },
    { "school": "國立政治大學", "url": "https://drive.google.com/file/d/1UAjMoDFNNPq-01vkqj88QNOq6N-FFKlM/view?usp=drive_link" },
    { "school": "國立臺北大學", "url": "https://cms-carrier.ntpu.edu.tw/uploads/115_ea8938f1ae.pdf" },
    { "school": "國立中興大學", "url": "https://recruit.nchu.edu.tw/grade-exam/sele/115/115sele_PAPER.pdf" },
    { "school": "國立中央大學", "url": "https://admission.ncu.edu.tw/files/system/files/57143/%E7%94%84%E8%A9%A6%E7%B0%A1%E7%AB%A0/%E5%85%B1%E5%90%8C/00-115%E7%A2%A9%E5%8D%9A%E7%94%84%E8%A9%A6%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "國立中山大學", "url": "https://exam-acad.nsysu.edu.tw/exam_netlist/pdf_file/aca/115ele_brief_11.pdf" },
    { "school": "國立中正大學", "url": "https://exams.ccu.edu.tw/var/file/32/1032/img/1133/s2_announce.html" },
    { "school": "臺北市立大學", "url": "https://drive.google.com/file/d/1DZyCYKvCmcnPovx9SAjOETWwWp_0LDol/view?usp=drive_link" },
    { "school": "國立暨南大學", "url": "https://drive.google.com/file/d/1m-VeITs5zMLAxH-mbaeBE6mj_uaH0mZy/view?usp=drive_link" },
    { "school": "國立聯合大學", "url": "https://drive.google.com/file/d/187alIKcGIZBmpSr9gfDktPEiTmrrUvlr/view?usp=drive_link" },
    { "school": "國立宜蘭大學", "url": "https://admniu.niu.edu.tw/var/file/54/1054/img/563/535069091.pdf" },
    { "school": "國立高雄大學", "url": "https://admissions.nuk.edu.tw/var/file/6/1006/img/921363900.pdf" },
    { "school": "國立嘉義大學", "url": "https://admissions.ncyu.edu.tw/announce/115_aada_2025091901.pdf" },
    { "school": "國立台南大學", "url": "https://drive.google.com/file/d/1mbDDY_2qoRLNV9hY6pAgeL0s4xqiH_pn/view?usp=drive_link" },
    { "school": "國立臺東大學", "url": "https://drive.google.com/file/d/1Wr6YxLqjVlsnqEITApEHzTXzs7pFcPax/view?usp=drive_link" },
    { "school": "國立高雄餐旅大學", "url": "https://gih.nkuht.edu.tw/p/406-1017-38743,r436.php?Lang=zh-tw" },
    { "school": "國立金門大學", "url": "https://drive.google.com/file/d/1kX8xX7pnxHjgFfQ1CoT8tXq6yA9Mwllf/view?usp=drive_link" },
    { "school": "國立東華大學", "url": "https://exam.ndhu.edu.tw/var/file/104/1104/attach/57/pta_145950_8183606_78146.pdf" },
    { "school": "國立屏東大學", "url": "https://admission.nptu.edu.tw/var/file/5/1005/img/4861/154005009.pdf" },
    { "school": "國立臺灣海洋大學", "url": "https://drive.google.com/file/d/1ROuIG2WUzUNETe7js6xAk4LVeZbzQOwO/view?usp=drive_link" },
    { "school": "國立體育大學", "url": "https://aca.ntsu.edu.tw/var/file/4/1004/img/181/344661336.pdf" },
    { "school": "國立臺灣藝術大學", "url": "https://aca.ntua.edu.tw/uploads/files/115%e7%a2%a9%e7%94%84%e6%8b%9b%e7%94%9f%e7%b0%a1%e7%ab%a0.pdf" },
    { "school": "國立臺北藝術大學", "url": "https://admissionex.tnua.edu.tw/wp-content/uploads/2025/09/115_master2.pdf" },
    { "school": "國立臺南藝術大學", "url": "https://acad.tnnua.edu.tw/var/file/3/1003/attach/56/pta_75610_8560696_80556.pdf" },
    { "school": "私立東吳大學", "url": "https://www.scu.edu.tw/entrance/anounce/115/C/C-book/C-book.pdf" },
    { "school": "私立世新大學", "url": "https://drive.google.com/file/d/1JULRP0oPZ7I0VPErJuJofZAvmH3SRm8i/view" },
    { "school": "私立銘傳大學", "url": "https://admission.wp.mcu.edu.tw/wp-content/uploads/2025/09/%E9%8A%98%E5%82%B3%E5%A4%A7%E5%AD%B8115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E7%A2%A9%E5%A3%AB%E7%8F%AD%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E6%8B%9B%E7%94%9F%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "私立實踐大學", "url": "https://drive.google.com/file/d/1PqrbhMQpk-xrhgclIF4umfHLzQHLbJjX/view?usp=drive_link" },
    { "school": "私立大同大學", "url": "https://recruit.ttu.edu.tw/var/file/68/1068/attach/57/pta_37821_6813237_25171.pdf" },
    { "school": "私立中原大學", "url": "https://drive.google.com/file/d/1plMiV-h_9cYziyT08_Yl6ZIxLve-4Fj3/view?usp=drive_link" },
    { "school": "私立輔仁大學", "url": "https://travellerlink.fju.edu.tw/Admission/data/Bulletins/b211bcb2-7f07-4430-aaca-0bc88b57c7ed.pdf" },
    { "school": "私立逢甲大學", "url": "https://webadmi.fcu.edu.tw/115/research/interview/115interview_notesx.pdf" },
    { "school": "私立東海大學", "url": "https://exam2.thu.edu.tw/EXAM/download_doc_21/115_regulations.pdf?s=20250925105945" },
    { "school": "私立長庚大學", "url": "https://www.cgu.edu.tw/recruit/ServerFile/Get/5637ed6d-4227-4961-bcd5-5f6634c0f979?nodeId=238&sId=70331&isCms=False" },
    { "school": "私立淡江大學", "url": "https://adms.tku.edu.tw/File/Userfiles/0000000105/files/%40115%E7%A2%A9%E5%8D%9A%E7%94%84%E7%B0%A1%E7%AB%A010_22%20(%E5%90%8D%E9%A1%8D%E6%A0%B8%E5%AE%9A).pdf" },
    { "school": "私立亞洲大學", "url": "https://rd.asia.edu.tw/var/file/2/1002/img/10/836817554.pdf" },
    { "school": "私立中國文化大學", "url": "https://drive.google.com/file/d/1TUtFLNwBndDJMZnKvpv1gg5FVmHWJggL/view?usp=drive_link" },
    { "school": "私立文藻外語大學", "url": "https://c057.wzu.edu.tw/datas/upload/files/115%E7%A0%94%E7%A9%B6%E6%89%80%E7%A2%A9%E5%A3%AB%E7%8F%AD%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E6%8B%9B%E7%94%9F%E7%B0%A1%E7%AB%A0_%E5%85%AC%E5%91%8A%E7%89%88.pdf" },
    { "school": "慈濟大學", "url": "https://admissions.tcu.edu.tw/wp-content/uploads/2025/09/115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E7%A0%94%E7%A9%B6%E6%89%80%E7%A2%A9%E5%A3%AB%E7%8F%AD%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E6%8B%9B%E7%94%9F%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "私立靜宜大學", "url": "https://adms.pu.edu.tw/var/file/123/1123/img/541338964.pdf" },
    { "school": "私立開南大學", "url": "https://drive.google.com/file/d/1SvNHfqsGoqG50EWd_bOS9t2p_DQChk5t/view?usp=drive_link" },
    { "school": "私立義守大學", "url": "https://drive.google.com/file/d/1gcywAai1-efWsPwGekS5M0iAdohosgST/view?usp=drive_link" },
    { "school": "私立華梵大學", "url": "https://www.hfu.edu.tw/File/Userfiles/0000000018/files/115%e5%ad%b8%e5%b9%b4%e5%ba%a6%e7%a2%a9%e5%a3%ab%e7%8f%ad%e7%94%84%e8%a9%a6%e7%b0%a1%e7%ab%a0(1141009%e5%85%ac%e5%91%8a).pdf" },
    { "school": "私立元智大學", "url": "https://www.yzu.edu.tw/admissions/files/AA/aplexam/115%E7%A2%A9%E5%8D%9A%E5%A3%AB%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "私立南華大學", "url": "https://nhuwebfile.nhu.edu.tw/UploadedFiles/2025/10/ee003f12-943a-47dd-ae9b-5fb9803f36dd.pdf" },
    { "school": "私立玄奘大學", "url": "https://www.hcu.edu.tw/upload/userfiles/7C38F4ED57614E278365DBC8FA404F1A/files/115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E7%A2%A9%E5%A3%AB%E7%8F%AD%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E6%8B%9B%E7%94%9F%E7%B0%A1%E7%AB%A0(1).pdf" },
    { "school": "私立臺北醫學大學", "url": "https://aca.tmu.edu.tw/download.php?dir=news&filename=643e98b5b26acbb81261f482c887efe7.pdf&title=%E6%8B%9B%E7%94%9F%E7%B0%A1%E7%AB%A0" },
    { "school": "私立高雄醫學大學", "url": "https://enr.kmu.edu.tw/yamgetdocbef.php?bno=gra,121&at=gra121_1.pdf" },
    { "school": "私立中國醫藥大學", "url": "https://adm21.cmu.edu.tw/sites/default/files/115%E7%A2%A9%E7%94%84%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "私立中山醫學大學", "url": "https://recruit.csmu.edu.tw/var/file/19/1019/attach/91/pta_35480_970020_74269.pdf" },
    { "school": "私立嘉南藥理大學", "url": "https://www.cnu.edu.tw/d_files/52/docs/20250918115148.pdf" },
    { "school": "私立馬偕醫學院", "url": "https://admissions.mmc.edu.tw/ImgMmcEdu/20250916150314.pdf" },
    { "school": "國立臺灣科技大學", "url": "https://www.admission.ntust.edu.tw/var/file/52/1052/img/2673/654649446.pdf" },
    { "school": "國立臺北科技大學", "url": "https://drive.google.com/file/d/1ylutdAsxdZhHLgYmewsJYAUC04ndqqjd/view?usp=drive_link" },
    { "school": "國立台北商業大學", "url": "https://drive.google.com/file/d/1MK72arCfZ4wj-g0ZUc5S1mt6uZNytvrd/view?usp=drive_link" },
    { "school": "國立高雄科技大學", "url": "https://drive.google.com/file/d/1T6ip8yKdaozjk5JD4kS5Qdodf00QAVUz/view?usp=drive_link" },
    { "school": "國立勤益科技大學", "url": "https://drive.google.com/file/d/1E2dJVsX56Lp4SIC89YA3N8KlolDd7AKi/view?usp=drive_link" },
    { "school": "國立雲林科技大學", "url": "https://examweb.yuntech.edu.tw/webexams/exam_s/" },
    { "school": "國立臺北護理健康大學", "url": "https://adm-acad.ntunhs.edu.tw/var/file/66/1066/attach/79/pta_66321_3695115_21263.pdf" },
    { "school": "國立台中科技大學", "url": "https://drive.google.com/file/d/1MPNApeI6DOsTxWCOFyMfGfTSyNPpQmP5/view?usp=drive_link" },
    { "school": "國立虎尾科技大學", "url": "https://drive.google.com/file/d/1RD29BFlefyGs2pfApfRdMgZvCf50odzd/view?usp=drive_link" },
    { "school": "國立澎湖科技大學", "url": "https://www.npu.edu.tw/df_ufiles/136/115%E6%BE%8E%E7%A7%91%E5%A4%A7%E7%A0%94%E7%A9%B6%E6%89%80%E7%94%84%E8%A9%A6%E5%85%A5%E5%AD%B8%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "國立屏東科技大學", "url": "https://www.npust.edu.tw/portaldoc/news/108479_2.pdf" },
    { "school": "國立臺灣師範大學", "url": "https://drive.google.com/file/d/1j2XldddIPDlRQW1q975rTZnY_8sDG5U6/view?usp=drive_link" },
    { "school": "國立臺北教育大學", "url": "https://drive.google.com/file/d/1wzAYwHQAy7D6D0dFfu0Czfpd_9Jffx_u/view?usp=drive_link" },
    { "school": "國立台中教育大學", "url": "https://drive.google.com/file/d/1Ljog90iWKTDWHRMy47ohV0FHtiZLfW-a/view?usp=drive_link" },
    { "school": "國立彰化師範大學", "url": "https://drive.google.com/file/d/13vA2rxn50WWTzy1zkqmkjBbovVzgvuht/view?usp=drive_link" },
    { "school": "國立高雄師範大學", "url": "https://c.nknu.edu.tw/aca/UploadFile/userfiles/4/files/%E6%8B%9B%E7%94%9F%E7%9B%AE%E9%8C%84/08%E6%AD%B7%E5%B1%86%E7%B0%A1%E7%AB%A0/06%E7%A2%A9%E5%8D%9A%E7%94%84%E8%A9%A6/115%E7%A2%A9%E5%8D%9A%E7%94%84%E8%A9%A6%E7%B0%A1%E7%AB%A0.pdf" },
    { "school": "國防醫學大學", "url": "https://drive.google.com/file/d/16_7SCbRPFudMIy9a7enZOuqQd0MjPYr3/view?usp=drive_link" }
];

async function updateBrochures() {
    console.log('Starting brochure update process...');

    let successCount = 0;
    let failCount = 0;

    for (const item of mappedUrls) {
        // Normalize name: replace 台 with 臺, strip "私立", and fix specific aliases
        let searchTerm = item.school.replace(/台/g, '臺');
        searchTerm = searchTerm.replace(/^私立/, '');
        if (searchTerm === '國防醫學大學') searchTerm = '國防醫學院';
        if (searchTerm === '馬偕醫學院') searchTerm = '馬偕醫學大學';

        // Find school_id from school name
        const { data: schools, error: schoolErr } = await supabase
            .from('schools')
            .select('school_id')
            .ilike('name', `%${searchTerm}%`);

        if (schoolErr) {
            console.error(`Error querying school ${item.school}:`, schoolErr.message);
            failCount++;
            continue;
        }

        const schoolRow = schools && schools[0];
        if (!schoolRow || !schoolRow.school_id) {
            console.error(`School not found in DB: ${item.school}`);
            failCount++;
            continue;
        }

        const schoolId = schoolRow.school_id;

        // Find all program_ids for this school
        const { data: programs, error: progErr } = await supabase
            .from('programs')
            .select('program_id')
            .eq('school_id', schoolId);

        if (progErr) {
            console.error(`Error querying programs for ${item.school}:`, progErr.message);
            failCount++;
            continue;
        }

        if (!programs || programs.length === 0) {
            console.warn(`No programs found for school: ${item.school}`);
            failCount++;
            continue;
        }

        const programIds = programs.map(p => p.program_id);

        // Update program_applications
        const { error: updateErr } = await supabase
            .from('program_applications')
            .update({ source_url: item.url })
            .in('program_id', programIds);

        if (updateErr) {
            console.error(`Failed to update records for ${item.school}:`, updateErr.message);
            failCount++;
        } else {
            console.log(`✅ Updated brochures for ${item.school}: ${item.url} (${programIds.length} programs)`);
            successCount++;
        }
    }

    console.log(`Finished. Success: ${successCount}, Failed: ${failCount}`);
}

updateBrochures();
