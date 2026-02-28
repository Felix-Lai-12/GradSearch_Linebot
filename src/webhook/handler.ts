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
import { supabase } from '../db/supabase';
import { URLSearchParams } from 'url';

export async function handleEvent(
    client: Client,
    event: WebhookEvent
): Promise<MessageAPIResponseBase | null> {
    // Handle Follow event (new friend added)
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

    if (!lineUserId) {
        console.warn('Follow event without userId');
        return null;
    }

    // Upsert user in database
    const { error } = await supabase
        .from('users')
        .upsert(
            { line_user_id: lineUserId },
            { onConflict: 'line_user_id' }
        );

    if (error) {
        console.error('Failed to upsert user:', error);
    }

    // Send welcome message
    const welcomeMessage = createWelcomeMessage();
    return client.replyMessage(event.replyToken, welcomeMessage);
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

    // Special commands
    if (userText === '幫助' || userText === '說明' || userText === 'help') {
        const welcomeMessage = createWelcomeMessage();
        return client.replyMessage(event.replyToken, welcomeMessage);
    }

    if (userText === '/search') {
        if (lineUserId) await setUserState(lineUserId, 'SEARCH');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '🔍 已切換至「直接查詢」模式。\n請直接輸入你想查的研究所，例如：「台大資工」'
        });
    }

    if (userText === '/chat') {
        if (lineUserId) await setUserState(lineUserId, 'AI_CHAT');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '💡 你好！我是你的專屬升學顧問。\n你可以告訴我你的背景、興趣或任何選校的問題，我會為你推薦 3 個合適的系所。\n例如：「我是私立資管系，想要考好找工作的國立大學所」'
        });
    }

    if (userText === '收藏' || userText === '我的收藏') {
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

            // Send a loading indication (optional, maybe not possible immediately without reply token reuse)
            // But we will directly attempt the API call. Line allows up to 30s response.
            const recommendations = await getRecommendations(lineUserId, userText);

            if (!recommendations || recommendations.length === 0) {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '😢 抱歉，我目前無法為你找到合適的推薦，請換個方式描述看看。'
                });
            }

            // Get Updated Quota
            const newUsage = await getUserQuotaStatus(lineUserId);
            const usageString = newUsage.max === -1 ? `目前已使用：${newUsage.count} 次 (無上限)` : `目前已使用：${newUsage.count} / ${newUsage.max} 次`;

            const aiMessage = createAiRecommendationMessage(recommendations, usageString);
            return client.replyMessage(event.replyToken, aiMessage);

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
