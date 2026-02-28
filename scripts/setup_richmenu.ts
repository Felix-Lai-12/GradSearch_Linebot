import { setupRichMenu, listRichMenus, deleteRichMenu } from '../dist/services/richmenu.js';

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'create':
            console.log('Creating Rich Menu...');
            const richMenuId = await setupRichMenu();
            console.log('\n✅ Rich Menu created successfully!');
            console.log('Rich Menu ID:', richMenuId);
            console.log('\nNext steps:');
            console.log('1. Create image (2500x843 px) with 3 sections:');
            console.log('   - Left: 🔍 搜尋系所');
            console.log('   - Middle: 💬 AI 推薦');
            console.log('   - Right: ❓ 使用說明');
            console.log('2. Upload image using LINE Developers Console or:');
            console.log(`   curl -X POST https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content \\`);
            console.log(`     -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \\`);
            console.log(`     -H "Content-Type: image/png" \\`);
            console.log(`     --data-binary @richmenu.png`);
            console.log('3. Set as default:');
            console.log(`   npm run richmenu set-default ${richMenuId}`);
            break;

        case 'list':
            console.log('Listing Rich Menus...');
            const menus = await listRichMenus();
            console.log(JSON.stringify(menus, null, 2));
            break;

        case 'delete':
            const menuId = process.argv[3];
            if (!menuId) {
                console.error('Please provide Rich Menu ID');
                process.exit(1);
            }
            console.log('Deleting Rich Menu:', menuId);
            await deleteRichMenu(menuId);
            console.log('✅ Deleted');
            break;

        default:
            console.log('Usage:');
            console.log('  npm run richmenu create       - Create new Rich Menu');
            console.log('  npm run richmenu list         - List all Rich Menus');
            console.log('  npm run richmenu delete <id>  - Delete Rich Menu');
    }
}

main().catch(console.error);
