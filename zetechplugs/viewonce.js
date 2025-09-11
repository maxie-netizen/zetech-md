const { downloadMediaMessage } = require('@whiskeysockets/baileys');

let zetechplug = async (m, { conn, reply, text, trashown, prefix, command, args }) => {
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const ownerNumber = global.owner[0] + '@s.whatsapp.net';
    
    // Check if sender is Owner or Bot
    const isOwner = m.sender === ownerNumber;
    const isBot = m.sender === botNumber;
    const isAuthorized = isOwner || isBot;

    // Extract command if prefixed
    const cmd = m.body.startsWith(prefix) 
        ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() 
        : '';

    // Detect reaction on View Once message
    const isReaction = m.message?.reactionMessage;
    const reactedToViewOnce = isReaction && m.quoted && (m.quoted.message.viewOnceMessage || m.quoted.message.viewOnceMessageV2);

    // Detect emoji reply (alone or with text) only on View Once media
    const isEmojiReply = m.body && /^[\p{Emoji}](\s|\S)*$/u.test(m.body.trim()) && 
                         m.quoted && (m.quoted.message.viewOnceMessage || m.quoted.message.viewOnceMessageV2);

    // Secret Mode = Emoji Reply or Reaction (For Bot/Owner Only) on View Once media
    const secretMode = (isEmojiReply || reactedToViewOnce) && isAuthorized;

    // Allow only `.vv`, `.vv2`, `.vv3`
    if (cmd && !['vv', 'vv2', 'vv3'].includes(cmd)) return;
    
    // Restrict VV commands properly
    if (cmd && !isAuthorized) return reply('*Only the owner or bot can use this command!*');

    // If not command & not secret mode, exit
    if (!cmd && !secretMode) return;

    // Ensure the message is a reply to a View Once message
    const targetMessage = reactedToViewOnce ? m.quoted : m;
    if (!targetMessage.quoted) return;
    
    let msg = targetMessage.quoted.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    else if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;

    // Additional check to ensure it's media (image, video, or audio)
    const messageType = msg ? Object.keys(msg)[0] : null;
    const isMedia = messageType && ['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType);
    
    if (!msg || !isMedia) return;

    try {
        let buffer = await downloadMediaMessage(targetMessage.quoted, 'buffer');
        if (!buffer) return;

        let mimetype = msg.audioMessage?.mimetype || 'audio/ogg';
        let caption = `> *ZETECH-MD EDITION*`;

        // Set recipient
        let recipient = secretMode || cmd === 'vv2' 
            ? botNumber
            : cmd === 'vv3' 
                ? ownerNumber
                : m.from;

        if (messageType === 'imageMessage') {
            await conn.sendMessage(recipient, { image: buffer, caption });
        } else if (messageType === 'videoMessage') {
            await conn.sendMessage(recipient, { video: buffer, caption, mimetype: 'video/mp4' });
        } else if (messageType === 'audioMessage') {  
            await conn.sendMessage(recipient, { audio: buffer, mimetype, ptt: true });
        }

        // Silent execution for secret mode
        if (!cmd) return;
        reply('*Media sent successfully!*');

    } catch (error) {
        console.error(error);
        if (cmd) await reply('*Failed to process View Once message!*');
    }
};

zetechplug.help = ['vv', 'vv2', 'vv3']
zetechplug.tags = ['owner']
zetechplug.command = ['vv', 'vv2', 'vv3']

module.exports = zetechplug;
