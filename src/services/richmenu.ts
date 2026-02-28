import * as line from '@line/bot-sdk';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.line.channelAccessToken
});

const blobClient = new line.messagingApi.MessagingApiBlobClient({
    channelAccessToken: config.line.channelAccessToken
});

/**
 * Create and set Rich Menu with 3 buttons (1x3 layout)
 */
export async function setupRichMenu() {
    // Step 1: Create Rich Menu
    const richMenu: line.messagingApi.RichMenuRequest = {
        size: {
            width: 2500,
            height: 843  // Compact height for 1 row
        },
        selected: true,
        name: 'GradSearch Main Menu',
        chatBarText: '功能選單',
        areas: [
            {
                bounds: { x: 0, y: 0, width: 833, height: 843 },
                action: { type: 'message', text: '/search' }
            },
            {
                bounds: { x: 833, y: 0, width: 834, height: 843 },
                action: { type: 'message', text: '/chat' }
            },
            {
                bounds: { x: 1667, y: 0, width: 833, height: 843 },
                action: { type: 'message', text: 'help' }
            }
        ]
    };

    try {
        const response = await client.createRichMenu(richMenu);
        const richMenuId = response.richMenuId;
        console.log('Rich Menu created:', richMenuId);

        // Step 2: Upload image
        const imagePath = path.join(process.cwd(), 'assets', 'richmenu.jpg');
        const imageBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        
        await blobClient.setRichMenuImage(richMenuId, blob);

        // Step 3: Set as default for all users
        await client.setDefaultRichMenu(richMenuId);

        return richMenuId;
    } catch (error) {
        console.error('Failed to create Rich Menu:', error);
        throw error;
    }
}

/**
 * Delete existing Rich Menu
 */
export async function deleteRichMenu(richMenuId: string) {
    try {
        await client.deleteRichMenu(richMenuId);
        console.log('Rich Menu deleted:', richMenuId);
    } catch (error) {
        console.error('Failed to delete Rich Menu:', error);
    }
}

/**
 * List all Rich Menus
 */
export async function listRichMenus() {
    try {
        const richMenus = await client.getRichMenuList();
        console.log('Rich Menus:', richMenus);
        return richMenus;
    } catch (error) {
        console.error('Failed to list Rich Menus:', error);
        return [];
    }
}
