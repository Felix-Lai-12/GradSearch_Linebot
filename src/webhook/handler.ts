import {
    WebhookEvent,
    MessageAPIResponseBase,
    TextMessage,
    Client,
    FollowEvent,
    MessageEvent,
    TextEventMessage,
} from '@line/bot-sdk';
import { createWelcomeMessage } from '../templates/welcome';
import { createSearchResultMessage, createSuggestionsMessage } from '../templates/search_result';
import { createFavoritesListMessage } from '../templates/favorites';
import { createAiRecommendationMessage } from '../templates/ai_result';
import { searchProgram, logSearch } from '../services/search';
import { toggleFavorite, getFavorites } from '../services/favorite';
import { getUserState, setUserState } from '../services/user_state';
import { getRecommendations } from '../services/ai_recommendation';
import { getUserQuotaStatus } from '../services/quota';
import { createGitHubIssue } from '../services/github';
import { supabase } from '../db/supabase';
import { URLSearchParams } from 'url';

export async function handleEvent(
    client: Client,
    event: WebhookEvent
): Promise<MessageAPIResponseBase | null> {
    // Handle Follow event (new friend added)
    console.log(`[Webhook] Received event type: ${event.type}`);
    if (event.type === 'follow') {
        return handleFollow(client, event);
    }

    // Handle text messages
    if (event.type === 'message' && event.message.type === 'text') {
        return handleTextMessage(client, event as MessageEvent & { message: TextEventMessage });
    }

    // Handle postback events (for favorites, pagination)
    if (event.type === 'postback') {
        return handlePostback(client, event);
    }

    return null;
}

/**
 * Handle Follow event: send welcome message + register user
 */
async function handleFollow(
    client: Client,
    event: FollowEvent
): Promise<MessageAPIResponseBase | null> {
    const lineUserId = event.source.userId;
    const replyToken = event.replyToken;

    console.log(`[Follow] New follower detected: ***${lineUserId?.slice(-6) || 'unknown'}`);

    if (!lineUserId) {
        console.warn('[Follow] Missing userId in follow event');
        return null;
    }

    // Attempt to upsert user, but don't let it block the welcome message
    try {
        const { error } = await supabase
            .from('users')
            .upsert(
                { line_user_id: lineUserId },
                { onConflict: 'line_user_id' }
            );

        if (error) {
            console.error('[Follow] Failed to upsert user to Supabase:', error);
        } else {
            console.log(`[Follow] User ***${lineUserId.slice(-6)} upserted successfully`);
        }
    } catch (e) {
        console.error('[Follow] Unexpected error during upsert:', e);
    }

    // Send welcome message
    console.log(`[Follow] Sending welcome message to ***${lineUserId.slice(-6)}`);
    try {
        const welcomeMessage = createWelcomeMessage();
        return await client.replyMessage(replyToken, welcomeMessage);
    } catch (err) {
        console.error('[Follow] Failed to send welcome message:', err);
        return null;
    }
}

/**
 * Handle text messages — keyword search
 */
async function handleTextMessage(
    client: Client,
    event: MessageEvent & { message: TextEventMessage }
): Promise<MessageAPIResponseBase | null> {
    const userText = event.message.text.trim();
    const lineUserId = event.source.userId || null;

    // --- 🔹 1. 導覽與幫助指令 (Navigation & Help) ---

    // [幫助/說明]: 傳送歡迎操作指南 (原本的 Welcome Flex)
    if (userText === '幫助' || userText === '說明' || userText === 'help' || userText === '/help') {
        const welcomeMessage = createWelcomeMessage();
        return client.replyMessage(event.replyToken, welcomeMessage);
    }

    // [介紹/使命]: 傳送 GradSearch 使命與功能介紹
    if (userText === '介紹' || userText === '/intro') {
        return client.replyMessage(event.replyToken, {
            type: 'flex',
            altText: 'GradSearch 完整功能介紹',
            contents: {
                type: 'bubble',
                size: 'mega',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '🎯 GradSearch 使命',
                            weight: 'bold',
                            size: 'lg',
                            color: '#1a1a2e'
                        }
                    ],
                    paddingAll: '20px',
                    backgroundColor: '#f0f4ff'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '幫助準備考研的人，以更低成本、更快速的方式找到適合自己的研究所。',
                            wrap: true,
                            size: 'sm',
                            color: '#333333'
                        },
                        {
                            type: 'text',
                            text: '「留學顧問產業常在賺取資訊差，但在 AI 時代，我們認為應該有更直接、透明的方式來解決這個問題。」',
                            style: 'italic',
                            margin: 'md',
                            wrap: true,
                            size: 'xs',
                            color: '#666666'
                        },
                        {
                            type: 'separator',
                            margin: 'lg'
                        },
                        {
                            type: 'text',
                            text: '🛠️ 目前可以做到什麼 (Beta 版)',
                            weight: 'bold',
                            size: 'sm',
                            margin: 'lg'
                        },
                        {
                            type: 'text',
                            text: '• 全台研究所申請時程、簡章一鍵取得\n• AI 檢索真實資料庫提供升學建議',
                            wrap: true,
                            size: 'xs',
                            color: '#555555',
                            margin: 'sm'
                        },
                        {
                            type: 'text',
                            text: '🚀 未來將嘗試什麼',
                            weight: 'bold',
                            size: 'sm',
                            margin: 'lg'
                        },
                        {
                            type: 'text',
                            text: '• 收錄海外研究所資料\n• 增加學長姐申請心得與錄取數據\n• 留學生活費與學費之成本預估\n• 輸入 /wish 來許願',
                            wrap: true,
                            size: 'xs',
                            color: '#555555',
                            margin: 'sm'
                        }
                    ],
                    paddingAll: '20px'
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            action: {
                                type: 'message',
                                label: '🔍 查詢系所資訊',
                                text: '/search'
                            },
                            style: 'primary',
                            color: '#1a73e8',
                            height: 'sm'
                        },
                        {
                            type: 'button',
                            action: {
                                type: 'message',
                                label: '🧭 跟 AI 聊聊再推薦',
                                text: '/chat'
                            },
                            style: 'secondary',
                            height: 'sm',
                            margin: 'sm'
                        },
                        {
                            type: 'button',
                            action: {
                                type: 'uri',
                                label: '🔗 查看 GitHub 專案原始碼',
                                uri: 'https://github.com/Felix-Lai-12/GradSearch_Linebot'
                            },
                            style: 'link',
                            height: 'sm',
                            margin: 'sm'
                        }
                    ],
                    paddingAll: '15px'
                }
            }
        });
    }

    // --- 🔹 2. 模式切換指令 (Mode Switching) ---

    // [切換至搜尋模式]
    if (userText === '/search') {
        if (lineUserId) await setUserState(lineUserId, 'SEARCH');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '🔍 已切換至「直接查詢」模式。\n請直接輸入你想查的研究所，例如：「台大資工」'
        });
    }

    // [切換至 AI 聊天模式]
    if (userText === '/chat') {
        if (lineUserId) await setUserState(lineUserId, 'AI_CHAT');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '💡 你好！我是你的專屬升學顧問。\n您可以告訴我您的背景、興趣或任何問題，我會為您推薦合適的系所。\n例如：「我是私立資管系，想要考好找工作的國立大學所」'
        });
    }

    // --- 🔹 3. 回饋與互動指令 (Feedback & Interaction) ---

    // [許願/功能建議]
    if (userText.startsWith('/wish')) {
        const wish = userText.replace('/wish', '').trim();
        if (!wish) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '請在 /wish 後面加上你的建議內容喔！\n例如：/wish 我想要查詢考古題'
            });
        }
        const result = await createGitHubIssue('feature', wish, lineUserId || 'anonymous');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: result.success
                ? `✅ 已收到你的許願！我們會盡快審核並考慮加入此功能。\n\n📋 追蹤進度：${result.issueUrl}`
                : '❌ 許願提交失敗，請稍後再試。'
        });
    }

    // [回報/錯誤回修]
    if (userText.startsWith('/bug')) {
        const bug = userText.replace('/bug', '').trim();
        if (!bug) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '請在 /bug 後面加上問題描述喔！\n例如：/bug 搜尋台大資工沒有反應'
            });
        }

        // 發送 Loading 動畫
        if (lineUserId) {
            try {
                await fetch('https://api.line.me/v2/bot/chat/loading/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                    },
                    body: JSON.stringify({ chatId: lineUserId, loadingSeconds: 20 })
                });
            } catch (e) {
                console.error('Failed to send loading start', e);
            }
        }

        const { processBugReport } = await import('../services/ai_bug_fixer');
        const fixResult = await processBugReport(bug);

        if (fixResult.is_fixable && fixResult.success) {
            // Optional: still log to GitHub for awareness
            await createGitHubIssue('bug', `[AUTO-FIXED] ${bug}\n\nApplied fix: ${JSON.stringify(fixResult)}`, lineUserId || 'anonymous');
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `✨ 感謝回報！系統 AI 已嘗試自動修復此問題！\n📝 處理結果：${fixResult.message}\n您可以嘗試重新查詢看看！`
            });
        } else {
            // Fallback
            const result = await createGitHubIssue('bug', `${bug}\n\n[Auto-Fix Failed] Reason: ${fixResult.message}`, lineUserId || 'anonymous');
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: result.success
                    ? `🤖 AI 自動修復嘗試失敗或資訊不足 (原因: ${fixResult.message || '未知'})。\n已將您的回報記錄至開發團隊待辦清單，我們會盡快人工確認！\n📋 追蹤進度：${result.issueUrl}`
                    : '❌ 回報提交失敗，請稍後再試。'
            });
        }
    }

    // [查看我的收藏]
    if (userText === '收藏' || userText === '我的收藏' || userText === '/fav') {
        if (!lineUserId) return null;
        const favorites = await getFavorites(lineUserId);
        const flexMessage = createFavoritesListMessage(favorites);
        return client.replyMessage(event.replyToken, flexMessage);
    }

    // Fetch current state
    let currentState = 'SEARCH';
    if (lineUserId) {
        currentState = await getUserState(lineUserId);
    }

    // --- AI CHAT MODE ---
    if (currentState === 'AI_CHAT') {
        if (!lineUserId) return null;

        try {
            // Check quota first to avoid calling AI if exhausted
            const usageInfo = await getUserQuotaStatus(lineUserId);
            if (usageInfo.count >= usageInfo.max && usageInfo.max !== -1) {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: `⚠️ 您今日的智能推薦額度 (${usageInfo.max}次) 已用罄，請明天再來喔！\n你可以輸入 /search 切換回直接搜尋模式。`
                });
            }

            // Send a loading indication
            try {
                // To avoid version issues with the SDK, use raw fetch for the Chat Loading API
                if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
                    fetch('https://api.line.me/v2/bot/chat/loading/start', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                        },
                        body: JSON.stringify({ chatId: lineUserId, loadingSeconds: 15 })
                    }).catch(err => console.error('Failed to send loading animation:', err));
                }
            } catch (err) {
                console.error('Error starting loading animation', err);
            }

            const aiResponse = await getRecommendations(lineUserId, userText);

            if (!aiResponse) {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '😢 抱歉，我目前無法為你找到合適的回覆，請換個方式描述看看。'
                });
            }

            // Get Updated Quota (only consumed if returned correctly in getRecommendations)
            const newUsage = await getUserQuotaStatus(lineUserId);
            const usageString = newUsage.max === -1 ? `目前已使用：${newUsage.count} 次 (無上限)` : `目前已使用：${newUsage.count} / ${newUsage.max} 次`;

            if (aiResponse.response_type === 'chat') {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: aiResponse.reply_message
                });
            } else if (aiResponse.response_type === 'recommendation' && aiResponse.recommendations) {
                const aiMessage = createAiRecommendationMessage(aiResponse.recommendations, usageString);
                // Send both text reply and flex message
                return client.replyMessage(event.replyToken, [
                    { type: 'text', text: aiResponse.reply_message },
                    aiMessage
                ]);
            } else {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '😢 抱歉，我不確定怎麼回覆，請再試一次。'
                });
            }

        } catch (e: any) {
            if (e.message === 'QUOTA_EXCEEDED') {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '⚠️ 您今日的智能推薦額度已用罄，請明天再來喔！\n您可以輸入 /search 切換回搜尋模式。'
                });
            }
            console.error('AI Error:', e);
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '⚠️ 處理您的訊息時發生錯誤，請稍後再試。'
            });
        }
    }

    // --- SEARCH MODE ---
    try {
        const response = await searchProgram(userText);

        // Log the search
        const resultsCount = response.type === 'found' ? 1 :
            response.type === 'suggestions' ? (response.suggestions?.length || 0) : 0;
        logSearch(lineUserId, userText, response.parsed!, resultsCount);

        switch (response.type) {
            case 'found': {
                const flexMessage = createSearchResultMessage(response.result!);
                return client.replyMessage(event.replyToken, flexMessage);
            }

            case 'need_more_info': {
                const reply: TextMessage = {
                    type: 'text',
                    text: response.message!,
                };
                return client.replyMessage(event.replyToken, reply);
            }

            case 'suggestions': {
                const flexMessage = createSuggestionsMessage(userText, response.suggestions!);
                return client.replyMessage(event.replyToken, flexMessage);
            }

            case 'not_found':
            default: {
                // If not found in SEARCH mode, gently suggest AI chat
                const reply: TextMessage = {
                    type: 'text',
                    text: response.message || `找不到「${userText}」相關的研究所 😢\n\n📌 試試其他關鍵字，例如：台大國企所\n💡 或輸入 /chat 讓 AI 顧問為您推薦系所！`,
                };
                return client.replyMessage(event.replyToken, reply);
            }
        }
    } catch (err) {
        console.error('Search error:', err);
        const reply: TextMessage = {
            type: 'text',
            text: '⚠️ 查詢時發生錯誤，請稍後再試。',
        };
        return client.replyMessage(event.replyToken, reply);
    }
}
/**
 * Handle postback events (e.g., toggle favorite)
 */
async function handlePostback(
    client: Client,
    event: any
): Promise<MessageAPIResponseBase | null> {
    const data = event.postback.data;
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const lineUserId = event.source.userId;

    if (!lineUserId) return null;

    if (action === 'favorite') {
        const programId = params.get('program_id');
        if (!programId) return null;

        try {
            const added = await toggleFavorite(lineUserId, programId);
            const replyText = added ? '✅ 已成功加入收藏！' : '🗑️ 已從收藏中移除。';

            // Postback can reply with a standard text or just do nothing (browser will show nothing)
            // But usually we reply with a simple confirmation
            const reply: TextMessage = {
                type: 'text',
                text: replyText,
            };
            return client.replyMessage(event.replyToken, reply);
        } catch (err) {
            console.error('Favorite toggle error:', err);
            return null;
        }
    }

    return null;
}
