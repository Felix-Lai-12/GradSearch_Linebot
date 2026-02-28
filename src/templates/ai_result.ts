import { FlexMessage, FlexBubble } from '@line/bot-sdk';
import { RecommendationResult } from '../services/ai_recommendation';

export function createAiRecommendationMessage(recommendations: RecommendationResult[], usageInfo: string): FlexMessage {
    const bubbles: FlexBubble[] = recommendations.map((rec) => {
        return {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `✨ AI 推薦系所`,
                        weight: 'bold',
                        color: '#6528e0',
                        size: 'sm',
                    },
                    {
                        type: 'text',
                        text: rec.school_name,
                        weight: 'bold',
                        size: 'xl',
                        color: '#1a1a2e',
                        margin: 'md',
                        wrap: true,
                    },
                    {
                        type: 'text',
                        text: rec.program_name,
                        size: 'md',
                        color: '#444444',
                        margin: 'sm',
                        wrap: true,
                    },
                ],
                paddingAll: '20px',
                backgroundColor: '#f6f3fc',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '💡 推薦理由：',
                        weight: 'bold',
                        size: 'sm',
                        color: '#1a1a2e',
                        margin: 'md',
                    },
                    {
                        type: 'text',
                        text: rec.reason,
                        size: 'sm',
                        color: '#555555',
                        margin: 'sm',
                        wrap: true,
                    },
                ],
                paddingAll: '20px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'message',
                            label: '🔍 查詢此系所簡章',
                            text: `${rec.school_name} ${rec.program_name}`
                        },
                        style: 'primary',
                        color: '#6528e0',
                        height: 'sm',
                    },
                ],
                paddingAll: '15px',
            },
        };
    });

    // Add a final bubble showing usage info
    bubbles.push({
        type: 'bubble',
        size: 'mega',
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: 'ℹ️ 智能推薦使用額度',
                    weight: 'bold',
                    size: 'md',
                    color: '#1a1a2e',
                    margin: 'md',
                },
                {
                    type: 'text',
                    text: usageInfo,
                    size: 'sm',
                    color: '#666666',
                    wrap: true,
                    margin: 'lg',
                },
                {
                    type: 'separator',
                    margin: 'xl',
                },
                {
                    type: 'text',
                    text: '還想繼續聊聊嗎？可以直接回覆我喔！',
                    size: 'sm',
                    color: '#1a73e8',
                    wrap: true,
                    margin: 'xl',
                },
            ],
            paddingAll: '20px',
            justifyContent: 'center',
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'button',
                    action: {
                        type: 'message',
                        label: '結束對話並手動查詢',
                        text: '/search'
                    },
                    style: 'secondary',
                    height: 'sm',
                },
            ],
            paddingAll: '15px',
        },
    });

    return {
        type: 'flex',
        altText: 'AI 為您推薦了 3 個研究所，點擊查看！',
        contents: {
            type: 'carousel',
            contents: bubbles,
        },
    };
}
