const { downloadMediaMessage } = require('@whiskeysockets/baileys');

let zetechplug = async (m, { conn, reply, text, trashown, prefix, command, args }) => {
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const ownerNumber = global.owner[0] + '@s.whatsapp.net';
    
    // Check if sender is Owner or Bot
    const isOwner = m.sender === ownerNumber;
    const isBot = m.sender === botNumber;
    const isAuthorized = isOwner || isBot;

    // Restrict VV commands properly
    if (!isAuthorized) return reply('*Only the owner or bot can use this command!*');

    // Ensure the message is a reply to a View Once message
    if (!m.quoted) return reply('*Please reply to a View Once message!*');
    
    console.log(`[VV PLUGIN DEBUG] Quoted message structure:`, JSON.stringify(m.quoted.message, null, 2));
    
    let msg = m.quoted.message;
    if (msg.viewOnceMessageV2) {
        console.log(`[VV PLUGIN DEBUG] Found viewOnceMessageV2`);
        msg = msg.viewOnceMessageV2.message;
    } else if (msg.viewOnceMessage) {
        console.log(`[VV PLUGIN DEBUG] Found viewOnceMessage`);
        msg = msg.viewOnceMessage.message;
    } else {
        console.log(`[VV PLUGIN DEBUG] No View Once message found. Available keys:`, Object.keys(msg));
        return reply('*This is not a View Once message!*');
    }

    // Additional check to ensure it's media (image, video, or audio)
    const messageType = msg ? Object.keys(msg)[0] : null;
    const isMedia = messageType && ['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType);
    
    if (!msg || !isMedia) return reply('*This View Once message is not a supported media type!*');

    try {
        let buffer = await downloadMediaMessage(m.quoted, 'buffer');
        if (!buffer) return reply('*Failed to download media!*');

        let mimetype = msg.audioMessage?.mimetype || 'audio/ogg';
        let caption = `> *ZETECH-MD EDITION*`;

        // Set recipient
        let recipient = command === 'vv2' 
            ? botNumber
            : command === 'vv3' 
                ? ownerNumber
                : m.from;

        if (messageType === 'imageMessage') {
            await conn.sendMessage(recipient, { image: buffer, caption });
        } else if (messageType === 'videoMessage') {
            await conn.sendMessage(recipient, { video: buffer, caption, mimetype: 'video/mp4' });
        } else if (messageType === 'audioMessage') {  
            await conn.sendMessage(recipient, { audio: buffer, mimetype, ptt: true });
        }

        reply('*Media sent successfully!*');

    } catch (error) {
        console.error(error);
        reply('*Failed to process View Once message!*');
    }
};

zetechplug.help = ['vv', 'vv2', 'vv3']
zetechplug.tags = ['owner']
zetechplug.command = ['vv', 'vv2', 'vv3']

module.exports = zetechplug;
