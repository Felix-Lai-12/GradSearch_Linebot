import { FlexMessage } from '@line/bot-sdk';

export function createWelcomeMessage(): FlexMessage {
    return {
        type: 'flex',
        altText: '歡迎使用 GradSearch！',
        contents: {
            type: 'bubble',
            size: 'mega',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🎓 GradSearch',
                        weight: 'bold',
                        size: 'xl',
                        color: '#1a1a2e',
                    },
                    {
                        type: 'text',
                        text: '全台研究所申請查詢助理',
                        size: 'sm',
                        color: '#666666',
                        margin: 'sm',
                    },
                ],
                paddingAll: '20px',
                backgroundColor: '#f0f4ff',
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '用 1 分鐘找到研究所申請重點 🎓',
                        weight: 'bold',
                        size: 'md',
                        margin: 'md',
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '• 簡章 / 截止日 / 報名費',
                                size: 'sm',
                                color: '#1a1a2e',
                            },
                            {
                                type: 'text',
                                text: '• 備審與面試時程整理',
                                size: 'sm',
                                color: '#1a1a2e',
                                margin: 'xs',
                            },
                            {
                                type: 'text',
                                text: '• 研究所升學方向 AI 諮詢',
                                size: 'sm',
                                color: '#1a1a2e',
                                margin: 'xs',
                            },
                        ],
                        margin: 'md',
                        paddingAll: '12px',
                        backgroundColor: '#f8f9fa',
                        cornerRadius: '8px',
                    },
                    {
                        type: 'text',
                        text: '你現在可以：',
                        weight: 'bold',
                        size: 'sm',
                        margin: 'lg',
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '🔍 查系所資訊（直接輸入「校名 + 系所」）',
                                size: 'sm',
                                color: '#555555',
                            },
                            {
                                type: 'text',
                                text: '💬 跟 AI 聊聊再推薦系所',
                                size: 'sm',
                                color: '#555555',
                                margin: 'xs',
                            },
                        ],
                        margin: 'sm',
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'text',
                        text: '其他指令：/bug 回報問題，/wish 功能許願\n*本服務由 AI 生成與整理資訊，請以各校官方公告為準。',
                        size: 'xs',
                        color: '#999999',
                        margin: 'md',
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
                            label: '🔍 查詢系所資訊',
                            text: '/search'
                        },
                        style: 'primary',
                        color: '#1a73e8',
                        height: 'sm',
                        margin: 'sm'
                    },
                    {
                        type: 'button',
                        action: {
                            type: 'message',
                            label: '🧭 跟 AI聊聊再推薦',
                            text: '/chat'
                        },
                        style: 'secondary',
                        height: 'sm',
                        margin: 'sm'
                    },
                    {
                        type: 'button',
                        action: {
                            type: 'message',
                            label: '🎓 完整功能介紹',
                            text: '/intro'
                        },
                        style: 'link',
                        height: 'sm',
                        margin: 'sm'
                    }
                ],
                paddingAll: '15px',
                backgroundColor: '#ffffff',
            },
        },
    };
}
