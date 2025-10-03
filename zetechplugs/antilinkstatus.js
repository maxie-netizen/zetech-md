let trashplug = async (m, { conn, reply, isAdmins }) => {
    try {
        // Check if user is admin
        if (!isAdmins) {
            return reply('❌ For Group Admins Only!');
        }

        const chatId = m.chat;
        const antilinkSetting = global.db.data.antilink?.[chatId];

        if (!antilinkSetting || !antilinkSetting.enabled) {
            return reply('🔓 *Antilink Status:* OFF\n\nUse `.antilink on` to enable protection.');
        }

        const status = antilinkSetting.enabled ? 'ON' : 'OFF';
        const action = antilinkSetting.action || 'delete';
        
        let actionEmoji = '🗑️';
        let actionText = 'Delete Messages';
        
        if (action === 'kick') {
            actionEmoji = '👢';
            actionText = 'Kick Users';
        } else if (action === 'warn') {
            actionEmoji = '⚠️';
            actionText = 'Warn Users';
        }

        const statusMessage = `🔒 *Antilink Status:* ${status}\n${actionEmoji} *Action:* ${actionText}\n\n*Protected Links:*\n• WhatsApp Groups\n• WhatsApp Channels\n• Telegram Links\n• General Links\n\n*Commands:*\n• \`.antilink on\` - Enable\n• \`.antilink off\` - Disable\n• \`.antilink set <action>\` - Change action`;

        return reply(statusMessage);

    } catch (error) {
        console.error('Error in antilinkstatus command:', error);
        return reply('❌ Error getting antilink status.');
    }
};

trashplug.help = ['antilinkstatus', 'antilinkget']
trashplug.tags = ['group']
trashplug.command = ['antilinkstatus', 'antilinkget']

module.exports = trashplug;
