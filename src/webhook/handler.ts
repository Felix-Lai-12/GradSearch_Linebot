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
import { searchProgram, logSearch } from '../services/search';
import { toggleFavorite, getFavorites } from '../services/favorite';
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

    if (userText === '收藏' || userText === '我的收藏') {
        if (!lineUserId) return null;
        const favorites = await getFavorites(lineUserId);
        const flexMessage = createFavoritesListMessage(favorites);
        return client.replyMessage(event.replyToken, flexMessage);
    }

    // Keyword search
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
                const reply: TextMessage = {
                    type: 'text',
                    text: response.message || `找不到「${userText}」相關的研究所 😢\n\n請試試其他關鍵字，例如：台大國企所、清大資工`,
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
