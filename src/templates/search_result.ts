import { FlexMessage } from '@line/bot-sdk';
import { SearchResult } from '../services/search';

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 查詢結果 Flex Message：顯示單筆研究所申請資訊
 */
export function createSearchResultMessage(result: SearchResult): FlexMessage {
    const infoRows: any[] = [];

    // 系所摘要 (FR-7)
    if (result.program_overview) {
        infoRows.push({
            type: 'text',
            text: result.program_overview,
            size: 'xs',
            color: '#666666',
            wrap: true,
            margin: 'sm',
        });
        infoRows.push({ type: 'separator', margin: 'md' });
    }

    if (result.admission_type) {
        infoRows.push(createInfoRow('📋 入學管道', result.admission_type));
    }

    // 招生名額 (FR-6)
    if (result.cohort_size) {
        infoRows.push(createInfoRow('👥 招生名額', `${result.cohort_size} 人`));
    }

    // 報名日期區間 (FR-1 + FR-2)
    if (result.apply_start_date && result.apply_end_date) {
        infoRows.push(createInfoRow('📅 報名期間', `${formatDate(result.apply_start_date)} ~ ${formatDate(result.apply_end_date)}`));
    } else if (result.apply_end_date) {
        infoRows.push(createInfoRow('📅 截止日期', formatDate(result.apply_end_date)));
    } else if (result.apply_start_date) {
        infoRows.push(createInfoRow('📅 報名開始', formatDate(result.apply_start_date)));
    }

    // 放榜日期 (FR-3)
    if (result.first_result_announce_date) {
        infoRows.push(createInfoRow('📣 初試放榜', formatDate(result.first_result_announce_date)));
    }
    if (result.second_result_announce_date) {
        infoRows.push(createInfoRow('🎊 複試放榜', formatDate(result.second_result_announce_date)));
    }

    if (result.application_fee) {
        infoRows.push(createInfoRow('💰 報名費', `NT$${result.application_fee.toLocaleString()}`));
    }

    if (result.interview_required !== null) {
        infoRows.push(createInfoRow('📝 口試', result.interview_required ? '✅ 需要' : '❌ 不需要'));
    }

    if (result.written_exam_required !== null) {
        infoRows.push(createInfoRow('📄 筆試', result.written_exam_required ? '✅ 需要' : '❌ 不需要'));
    }

    if (result.portfolio_required !== null) {
        infoRows.push(createInfoRow('🎨 作品集', result.portfolio_required ? '✅ 需要' : '❌ 不需要'));
    }

    // 必備文件
    if (result.required_documents && typeof result.required_documents === 'object') {
        const docs: string[] = [];
        const rd = result.required_documents;
        if (rd.sop) docs.push('自傳');
        if (rd.transcript) docs.push('成績單');
        if (rd.resume) docs.push('履歷');
        if (rd.recommendation_letters) docs.push(`推薦信×${rd.recommendation_letters}`);
        if (rd.portfolio) docs.push('作品集');
        if (docs.length > 0) {
            infoRows.push(createInfoRow('📋 必備文件', docs.join(' / ')));
        }
    }

    // 研究方向 (FR-9)
    if (result.research_areas && result.research_areas.length > 0) {
        infoRows.push(createInfoRow('🔬 研究方向', result.research_areas.join(', ')));
    }

    // 資料狀態標籤 (FR-4 + FR-5)
    if (result.data_status === 'deprecated') {
        infoRows.push({
            type: 'text',
            text: '⚠️ 此資料可能已過期，僅供參考',
            size: 'xxs',
            color: '#cc6600',
            margin: 'md',
            wrap: true,
        });
    } else if (result.verified_at) {
        const verifiedDate = formatDate(result.verified_at);
        infoRows.push({
            type: 'text',
            text: `✅ 最後驗證：${verifiedDate}`,
            size: 'xxs',
            color: '#999999',
            margin: 'md',
            wrap: true,
        });
    }

    // If no application data at all
    if (infoRows.length === 0) {
        infoRows.push({
            type: 'text',
            text: '⚠️ 尚無申請資料，待更新中',
            size: 'sm',
            color: '#999999',
            margin: 'md',
            wrap: true,
        });
    }

    // Footer buttons
    const footerContents: any[] = [];

    // ⭐️ 收藏按鈕 (Always present)
    footerContents.push({
        type: 'button',
        action: {
            type: 'postback',
            label: '⭐️ 收藏此系所',
            data: `action=favorite&program_id=${result.program_id}`,
            displayText: '⭐ 已收藏！',
        },
        style: 'primary',
        color: '#1a73e8',
        height: 'sm',
        margin: 'sm',
    });

    // 🔗 Source URL button (如果有簡章)
    if (result.source_url) {
        footerContents.push({
            type: 'button',
            action: {
                type: 'uri',
                label: '🔗 查看簡章',
                uri: result.source_url,
            },
            style: 'secondary',
            height: 'sm',
            margin: 'sm',
        });
    }

    // 📚 課程資訊 / 系所網站 (優先使用 curriculum_url，沒有則 fallback 到 website)
    const curriculumLink = result.curriculum_url || result.website;
    if (curriculumLink) {
        // 清理 URI：移除空白後的所有內容（通常是中文註解）
        let cleanUri = curriculumLink.trim().split(/\s/)[0];
        // 移除反斜線和引號
        cleanUri = cleanUri.replace(/["\\\s]/g, '');
        
        if (cleanUri && cleanUri.startsWith('http')) {
            footerContents.push({
                type: 'button',
                action: {
                    type: 'uri',
                    label: '📚 課程與系所資訊',
                    uri: cleanUri,
                },
                style: 'secondary',
                height: 'sm',
                margin: 'sm',
            });
        }
    }

    // 👨‍🏫 師資/實驗室 (FR-10)
    if (result.faculty_url || result.labs_url) {
        footerContents.push({
            type: 'button',
            action: {
                type: 'uri',
                label: '👨‍🏫 師資/實驗室',
                uri: result.faculty_url || result.labs_url || '',
            },
            style: 'secondary',
            height: 'sm',
            margin: 'sm',
        });
    }

    const qsText = result.qs_rank ? `｜QS: ${result.qs_rank}` : '｜QS: -';
    const cityText = result.city ? `${result.city}` : '';

    // Handle degree string mapping (["碩士"] -> 碩士)
    let displayDegree = result.degree || '';
    if (displayDegree.includes('碩士')) displayDegree = '碩士';
    else if (displayDegree.includes('博士')) displayDegree = '博士';
    else displayDegree = displayDegree.replace(/[\[\]"]/g, '');

    return {
        type: 'flex',
        altText: `${result.school_name} ${result.program_name}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `🎓 ${result.school_name}${qsText}`,
                        weight: 'bold',
                        size: 'lg',
                        color: '#1a1a2e',
                        wrap: true,
                    },
                    {
                        type: 'text',
                        text: cityText,
                        size: 'xs',
                        color: '#888888',
                        margin: 'sm',
                        wrap: true,
                    },
                    {
                        type: 'text',
                        text: `${result.admission_year || ''} 研究所推甄 ｜ ${result.program_name} ${displayDegree}班`,
                        size: 'sm',
                        color: '#555555',
                        margin: 'md',
                        wrap: true,
                    },
                ],
                paddingAll: '18px',
                backgroundColor: '#f0f4ff',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: infoRows,
                paddingAll: '18px',
                spacing: 'sm',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: footerContents,
                paddingAll: '12px',
                spacing: 'sm',
            },
        },
    };
}

/**
 * Helper: create a label-value row
 */
function createInfoRow(label: string, value: string): any {
    return {
        type: 'box',
        layout: 'horizontal',
        contents: [
            {
                type: 'text',
                text: label,
                size: 'sm',
                color: '#888888',
                flex: 0,
                wrap: false,
            },
            {
                type: 'text',
                text: value,
                size: 'sm',
                color: '#333333',
                align: 'end',
                weight: 'bold',
                wrap: true,
            },
        ],
        margin: 'md',
    };
}

/**
 * 模糊搜尋建議 Flex Message
 */
export function createSuggestionsMessage(
    originalQuery: string,
    suggestions: Array<{ program_id: string; name: string; school_name: string }>
): FlexMessage {
    const items = suggestions.slice(0, 5).map(s => ({
        type: 'button' as const,
        action: {
            type: 'message' as const,
            label: `${s.school_name.replace('國立', '')} ${s.name}`.slice(0, 20),
            text: `${s.school_name.replace('國立', '')}${s.name}`,
        },
        style: 'secondary' as const,
        height: 'sm' as const,
        margin: 'sm' as const,
    }));

    return {
        type: 'flex',
        altText: `找不到「${originalQuery}」，你是不是要找...？`,
        contents: {
            type: 'bubble',
            size: 'mega',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `🔍 找不到「${originalQuery}」`,
                        weight: 'bold',
                        size: 'md',
                    },
                    {
                        type: 'text',
                        text: '你是不是要找...',
                        size: 'sm',
                        color: '#888888',
                        margin: 'sm',
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: items as any[],
                        margin: 'lg',
                        spacing: 'xs',
                    },
                ],
                paddingAll: '18px',
            },
        },
    };
}
