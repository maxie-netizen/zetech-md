let trashplug = async (m, { conn, reply, isAdmins, groupMetadata }) => {
    try {
        // Check if user is admin
        if (!isAdmins) {
            return reply('❌ Only admins can use the .tagall command.');
        }

        // Get group metadata
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            return reply('❌ No participants found in the group.');
        }

        // Create message with each member on a new line
        let message = '🔊 *Group Members:*\n\n';
        participants.forEach(participant => {
            message += `@${participant.id.split('@')[0]}\n`; // Add \n for new line
        });

        // Send message with mentions
        await conn.sendMessage(m.chat, {
            text: message,
            mentions: participants.map(p => p.id)
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        return reply('❌ Failed to tag all members.');
    }
};

trashplug.help = ['tagall']
trashplug.tags = ['group']
trashplug.command = ['tagall']

module.exports = trashplug;
