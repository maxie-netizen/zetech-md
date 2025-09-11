let zetechplug = async (m, { conn, reply, text, trashown, prefix, command, args }) => {
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const ownerNumber = global.owner[0] + '@s.whatsapp.net';
    
    // Check if sender is Owner or Bot
    const isOwner = m.sender === ownerNumber;
    const isBot = m.sender === botNumber;
    const isAuthorized = isOwner || isBot;

    if (!isAuthorized) return reply('*❌ Only owner can use this command*');

    let responseMessage;

    if (args[0] === 'on') {
        global.alwaysOnline = true;
        responseMessage = "*✅ Always Online has been enabled.*";
    } else if (args[0] === 'off') {
        global.alwaysOnline = false;
        responseMessage = "*❌ Always Online has been disabled.*";
    } else {
        responseMessage = `*Usage:*
• \`${prefix}alwaysonline on\` - Enable Always Online
• \`${prefix}alwaysonline off\` - Disable Always Online

*Current Status:* ${global.alwaysOnline ? '🟢 Enabled' : '🔴 Disabled'}`;
    }

    try {
        reply(responseMessage);
    } catch (error) {
        console.error("Error processing alwaysonline command:", error);
        reply('*Error processing your request.*');
    }
};

zetechplug.help = ['alwaysonline']
zetechplug.tags = ['owner']
zetechplug.command = ['alwaysonline']

module.exports = zetechplug;
