import { FlexMessage } from '@line/bot-sdk';

/**
 * 我的收藏列表 Flex Message
 */
export function createFavoritesListMessage(favorites: any[]): FlexMessage {
    if (favorites.length === 0) {
        return {
            type: 'flex',
            altText: '我的收藏清單',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '⭐ 目前還沒有收藏喔！',
                            weight: 'bold',
                            size: 'md',
                            align: 'center',
                        },
                        {
                            type: 'text',
                            text: '在搜尋結果點擊「收藏此系所」即可加入清單。',
                            size: 'xs',
                            color: '#888888',
                            align: 'center',
                            margin: 'md',
                            wrap: true,
                        },
                    ],
                    paddingAll: '20px',
                },
            },
        };
    }

    const items: any[] = favorites.slice(0, 10).map((fav) => ({
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        spacing: 'sm',
        contents: [
            {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    {
                        type: 'text',
                        text: `🎓 ${fav.school_name}${fav.qs_rank ? ` | QS: ${fav.qs_rank}` : ''}`,
                        size: 'xs',
                        color: '#1a73e8',
                        weight: 'bold',
                        flex: 4,
                    },
                ],
            },
            {
                type: 'text',
                text: `${fav.program_name} ${fav.degree}班`,
                size: 'sm',
                weight: 'bold',
                wrap: true,
            },
            {
                type: 'button',
                action: {
                    type: 'message',
                    label: '🔍 查看詳情',
                    text: `${fav.school_name} ${fav.program_name}`,
                },
                style: 'secondary',
                height: 'sm',
                margin: 'sm',
            },
            {
                type: 'separator',
                margin: 'md',
            },
        ],
    }));

    return {
        type: 'flex',
        altText: '我的收藏清單',
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#1a73e8',
                contents: [
                    {
                        type: 'text',
                        text: '⭐ 我的收藏清單',
                        color: '#ffffff',
                        weight: 'bold',
                        size: 'lg',
                    },
                ],
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: items,
                paddingAll: '15px',
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: favorites.length > 10 ? `顯示最近 10 筆（共 ${favorites.length} 筆）` : `共 ${favorites.length} 筆收藏`,
                        size: 'xs',
                        color: '#aaaaaa',
                        align: 'center',
                    },
                ],
            },
        },
    };
}
