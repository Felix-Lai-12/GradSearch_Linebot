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
                        text: '台灣研究所查詢小幫手',
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
                        text: '歡迎使用 GradSearch！',
                        weight: 'bold',
                        size: 'md',
                        margin: 'md',
                    },
                    {
                        type: 'text',
                        text: '我可以幫你查詢台灣研究所的申請資訊，包含截止日期、報名費、備審資料等。',
                        size: 'sm',
                        color: '#555555',
                        margin: 'md',
                        wrap: true,
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'text',
                        text: '💡 使用方式',
                        weight: 'bold',
                        size: 'sm',
                        margin: 'lg',
                    },
                    {
                        type: 'text',
                        text: '直接輸入「校名 + 系所」就能查詢',
                        size: 'sm',
                        color: '#555555',
                        margin: 'sm',
                        wrap: true,
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'text',
                                text: '台大國企所',
                                size: 'sm',
                                color: '#1a73e8',
                            },
                            {
                                type: 'text',
                                text: '清大資工',
                                size: 'sm',
                                color: '#1a73e8',
                                margin: 'xs',
                            },
                            {
                                type: 'text',
                                text: '成大電機所',
                                size: 'sm',
                                color: '#1a73e8',
                                margin: 'xs',
                            },
                        ],
                        margin: 'md',
                        paddingAll: '12px',
                        backgroundColor: '#f8f9fa',
                        cornerRadius: '8px',
                    },
                    {
                        type: 'separator',
                        margin: 'lg',
                    },
                    {
                        type: 'text',
                        text: '輸入「幫助」查看使用說明',
                        size: 'xs',
                        color: '#999999',
                        margin: 'lg',
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
                            label: '🔍 直接查詢特定系所',
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
                            label: '💬 我還不確定想先聊聊',
                            text: '/chat'
                        },
                        style: 'secondary',
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
