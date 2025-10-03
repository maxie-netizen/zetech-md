const AutoSync = require('../library/lib/autoSync');

let autoSync = null;

// Initialize cloud database adapter
async function initializeCloudDB() {
    if (!autoSync) {
        autoSync = new AutoSync();
        await autoSync.initialize();
    }
    return autoSync;
}

async function cloudsyncCommand(sock, chatId, message, args) {
    try {
        // Check if sender is owner
        const ownerNumber = global.owner[0] + '@s.whatsapp.net';
        if (message.key.remoteJid !== ownerNumber) {
            await sock.sendMessage(chatId, {
                text: '❌ This command can only be used by the owner!'
            });
            return;
        }

        const action = args[0]?.toLowerCase();
        
        if (!action) {
            const helpMessage = `┌ ❏ *⌜ CLOUD SYNC GUIDE ⌟* ❏
│
├◆ 🔄 Cloud storage commands for ZETECH-MD
│
├◆ 💡 Usage: \`.cloudsync <action>\`
│
├◆ 📌 *Available Actions:*
├◆ \`sync\` - Sync all data to cloud
├◆ \`load\` - Load all data from cloud
├◆ \`status\` - Check cloud connection status
├◆ \`force\` - Force sync all data
├◆ \`stop\` - Stop auto-sync
├◆ \`start\` - Start auto-sync
│
├◆ 💡 *Note:* Requires MEGA_EMAIL and MEGA_PASSWORD
└ ❏`;
            
            await sock.sendMessage(chatId, {
                text: helpMessage,
                react: { text: '☁️', key: message.key }
            });
            return;
        }

        // Initialize cloud DB if not already done
        const autoSync = await initializeCloudDB();
        
        let response = '';
        
        switch (action) {
            case 'sync':
                await sock.sendMessage(chatId, {
                    text: '🔄 Syncing data to cloud...',
                    react: { text: '🔄', key: message.key }
                });
                
                const syncResult = await autoSync.forceSync();
                response = syncResult 
                    ? '✅ All data synced to cloud successfully!'
                    : '❌ Failed to sync data to cloud!';
                break;
                
            case 'load':
                await sock.sendMessage(chatId, {
                    text: '🔄 Loading data from cloud...',
                    react: { text: '🔄', key: message.key }
                });
                
                const loadResult = await autoSync.forceSync();
                response = loadResult 
                    ? '✅ All data loaded from cloud successfully!'
                    : '❌ Failed to load data from cloud!';
                break;
                
            case 'status':
                const isConnected = autoSync.isInitialized;
                response = isConnected 
                    ? '✅ Cloud storage connected and ready!'
                    : '❌ Cloud storage not connected!';
                break;
                
            case 'force':
                await sock.sendMessage(chatId, {
                    text: '🔄 Force syncing all data...',
                    react: { text: '🔄', key: message.key }
                });
                
                const forceResult = await autoSync.forceSync();
                response = forceResult 
                    ? '✅ Force sync completed successfully!'
                    : '❌ Force sync failed!';
                break;
                
            case 'stop':
                await autoSync.disconnect();
                response = '✅ Auto-sync stopped!';
                break;
                
            case 'start':
                await autoSync.initialize();
                response = '✅ Auto-sync started!';
                break;
                
            default:
                response = '❌ Invalid action! Use \`.cloudsync\` to see available commands.';
        }
        
        await sock.sendMessage(chatId, {
            text: response,
            react: { text: '☁️', key: message.key }
        });

    } catch (error) {
        console.error('Cloudsync Command Error:', error);
        
        await sock.sendMessage(chatId, {
            text: `❌ Cloud sync error: ${error.message}`,
            react: { text: '❌', key: message.key }
        });
    }
}

// Export the command function
module.exports = {
    cloudsyncCommand,
    initializeCloudDB
};
