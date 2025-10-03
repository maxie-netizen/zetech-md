let trashplug = async (m, { conn, reply, isAdmins, text, args }) => {
    try {
        // Check if user is admin
        if (!isAdmins) {
            return reply('❌ For Group Admins Only!');
        }

        const action = args[0]?.toLowerCase();

        if (!action) {
            const usage = `\`\`\`ANTILINK SETUP\n\n.antilink on\n.antilink set delete | kick | warn\n.antilink off\n.antilink get\n\`\`\``;
            return reply(usage);
        }

        switch (action) {
            case 'on':
                // Check if antilink is already enabled
                const existingConfig = global.db.data.antilink?.[m.chat];
                if (existingConfig?.enabled) {
                    return reply('*_Antilink is already on_*');
                }
                
                // Enable antilink with default action 'delete'
                if (!global.db.data.antilink) global.db.data.antilink = {};
                global.db.data.antilink[m.chat] = { enabled: true, action: 'delete' };
                
                return reply('*_Antilink has been turned ON_*');

            case 'off':
                // Disable antilink
                if (global.db.data.antilink?.[m.chat]) {
                    delete global.db.data.antilink[m.chat];
                }
                return reply('*_Antilink has been turned OFF_*');

            case 'set':
                if (args.length < 2) {
                    return reply('*_Please specify an action: .antilink set delete | kick | warn_*');
                }
                
                const setAction = args[1].toLowerCase();
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    return reply('*_Invalid action. Choose delete, kick, or warn._*');
                }
                
                // Set antilink action
                if (!global.db.data.antilink) global.db.data.antilink = {};
                if (!global.db.data.antilink[m.chat]) global.db.data.antilink[m.chat] = { enabled: true };
                global.db.data.antilink[m.chat].action = setAction;
                
                return reply(`*_Antilink action set to ${setAction}_*`);

            case 'get':
                const status = global.db.data.antilink?.[m.chat];
                const statusText = status?.enabled ? 'ON' : 'OFF';
                const actionText = status?.action || 'Not set';
                
                return reply(`*_Antilink Configuration:_*\nStatus: ${statusText}\nAction: ${actionText}`);

            default:
                return reply('*_Use .antilink for usage._*');
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        return reply('*_Error processing antilink command_*');
    }
};

// Function to handle link detection
async function handleLinkDetection(conn, m) {
    try {
        const antilinkSetting = global.db.data.antilink?.[m.chat];
        if (!antilinkSetting?.enabled) return;

        const userMessage = m.text || '';
        const senderId = m.sender;
        const chatId = m.chat;

        console.log(`Antilink Setting for ${chatId}: ${antilinkSetting.action}`);
        console.log(`Checking message for links: ${userMessage}`);
        
        let shouldDelete = false;

        const linkPatterns = {
            whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/,
            whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/,
            telegram: /t\.me\/[A-Za-z0-9_]+/,
            allLinks: /https?:\/\/[^\s]+/,
        };

        // Check for various link types
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            console.log('Detected a WhatsApp group link!');
            shouldDelete = true;
        } else if (linkPatterns.whatsappChannel.test(userMessage)) {
            console.log('Detected a WhatsApp channel link!');
            shouldDelete = true;
        } else if (linkPatterns.telegram.test(userMessage)) {
            console.log('Detected a Telegram link!');
            shouldDelete = true;
        } else if (linkPatterns.allLinks.test(userMessage)) {
            console.log('Detected a general link!');
            shouldDelete = true;
        }

        if (shouldDelete) {
            const action = antilinkSetting.action || 'delete';
            
            if (action === 'delete') {
                // Delete the message
                try {
                    await conn.sendMessage(chatId, {
                        delete: { 
                            remoteJid: chatId, 
                            fromMe: false, 
                            id: m.key.id, 
                            participant: m.sender 
                        },
                    });
                    console.log(`Message with ID ${m.key.id} deleted successfully.`);
                } catch (error) {
                    console.error('Failed to delete message:', error);
                }
            } else if (action === 'kick') {
                // Kick the user (implement kick logic here)
                try {
                    await conn.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    console.log(`User ${senderId} kicked for posting links.`);
                } catch (error) {
                    console.error('Failed to kick user:', error);
                }
            } else if (action === 'warn') {
                // Send warning message
                await conn.sendMessage(chatId, { 
                    text: `⚠️ Warning! @${senderId.split('@')[0]}, posting links is not allowed.`, 
                    mentions: [senderId] 
                });
            }
        } else {
            console.log('No link detected or protection not enabled for this type of link.');
        }
    } catch (error) {
        console.error('Error in link detection:', error);
    }
}

trashplug.help = ['antilink']
trashplug.tags = ['group']
trashplug.command = ['antilink']

module.exports = trashplug;
module.exports.handleLinkDetection = handleLinkDetection;
