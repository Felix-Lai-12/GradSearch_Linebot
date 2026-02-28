import { supabase } from '../db/supabase';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export async function getOrInitHistory(userId: string): Promise<{ chatHistoryId: string, messages: ChatMessage[] }> {
    // Get chatHistoryId from user_states
    const { data: stateRecord } = await supabase
        .from('user_states')
        .select('chat_history_id')
        .eq('user_id', userId)
        .single();

    const chatHistoryId = stateRecord?.chat_history_id;

    if (chatHistoryId) {
        const { data: record } = await supabase
            .from('user_chat_history')
            .select('updated_at, messages')
            .eq('chat_history_id', chatHistoryId)
            .single();

        if (record) {
            const updatedAt = new Date(record.updated_at).getTime();
            const hoursDiff = (Date.now() - updatedAt) / (1000 * 60 * 60);

            if (hoursDiff < 24) {
                return { chatHistoryId, messages: record.messages || [] };
            }
        }
    }

    // Create a new one
    const { data: newRecord, error } = await supabase
        .from('user_chat_history')
        .insert({ messages: [] })
        .select('chat_history_id')
        .single();

    if (error || !newRecord) {
        throw new Error('Failed to init chat history');
    }

    const newId = newRecord.chat_history_id;

    await supabase
        .from('user_states')
        .update({ chat_history_id: newId })
        .eq('user_id', userId);

    return { chatHistoryId: newId, messages: [] };
}

export async function appendChatHistory(
    chatHistoryId: string,
    messages: ChatMessage[],
    userText: string,
    aiRawResponse: string
): Promise<void> {

    messages.push({ role: 'user', parts: [{ text: userText }] });
    messages.push({ role: 'model', parts: [{ text: aiRawResponse }] });

    // Keep last 10 pairs (20 messages)
    if (messages.length > 20) {
        messages.splice(0, messages.length - 20);
    }

    await supabase
        .from('user_chat_history')
        .update({
            messages,
            updated_at: new Date().toISOString()
        })
        .eq('chat_history_id', chatHistoryId);
}

export async function clearHistory(chatHistoryId: string): Promise<void> {
    await supabase
        .from('user_chat_history')
        .delete()
        .eq('chat_history_id', chatHistoryId);
}
