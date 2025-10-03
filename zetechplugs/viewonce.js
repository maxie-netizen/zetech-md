const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

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
    
    // Enhanced debug logging to understand quoted message structure
    console.log(`[VV PLUGIN DEBUG] Full quoted object:`, JSON.stringify(m.quoted, null, 2));
    console.log(`[VV PLUGIN DEBUG] Quoted object keys:`, Object.keys(m.quoted || {}));
    
    // Check if quoted message exists - be more flexible with structure detection
    const hasMessage = m.quoted.message || m.quoted.msg;
    const hasViewOnce = m.quoted.viewOnce || m.quoted.viewOnceMessage || m.quoted.viewOnceMessageV2;
    const hasMedia = m.quoted.mimetype || m.quoted.mtype;
    
    if (!hasMessage && !hasViewOnce && !hasMedia) {
        console.log(`[VV PLUGIN DEBUG] No valid quoted message structure found`);
        return reply('*Invalid quoted message!*');
    }
    
    console.log(`[VV PLUGIN DEBUG] Quoted message structure:`, JSON.stringify(m.quoted.message || m.quoted.msg, null, 2));
    
    try {
        // Check if it's a direct view-once message (no nested message structure)
        if ((m.quoted.viewOnce || m.quoted.viewOnceMessage || m.quoted.viewOnceMessageV2) && !m.quoted.message) {
            console.log(`[VV PLUGIN DEBUG] Found direct view-once message`);
            // This is a direct view-once message, use the quoted object directly
            const quoted = m.quoted;
            
            // Extract media from the direct view-once message
            // The media properties are directly in the quoted object
            const mimetype = quoted?.mimetype || quoted?.mtype;
            const quotedImage = mimetype?.startsWith('image/') ? quoted : null;
            const quotedVideo = mimetype?.startsWith('video/') ? quoted : null;
            const quotedAudio = mimetype?.startsWith('audio/') ? quoted : null;
            
            // Set recipient with proper JID formatting
            let recipient;
            if (command === 'vv2') {
                recipient = botNumber;
            } else if (command === 'vv3') {
                recipient = ownerNumber;
            } else {
                recipient = m.chat; // Use m.chat instead of m.from
            }
            
            console.log(`[VV PLUGIN DEBUG] Sending to recipient: ${recipient}`);
            console.log(`[VV PLUGIN DEBUG] m.chat: ${m.chat}, m.from: ${m.from}`);

            let caption = `> *❦ ════ •⊰❂ ZETECH-MD ❂⊱• ════ ❦*`;

            if (quotedImage) {
                console.log(`[VV PLUGIN DEBUG] Found view-once image`);
                try {
                    // Download and send the image
                    const stream = await downloadContentFromMessage(quotedImage, 'image');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    
                    console.log(`[VV PLUGIN DEBUG] Image buffer size: ${buffer.length} bytes`);
                    
                    await conn.sendMessage(recipient, { 
                        image: buffer, 
                        caption: caption 
                    });
                    return;
                } catch (sendError) {
                    console.error(`[VV PLUGIN ERROR] Failed to send image:`, sendError);
                    reply('*❌ Failed to send image!*');
                    return;
                }
            } else if (quotedVideo) {
                console.log(`[VV PLUGIN DEBUG] Found view-once video`);
                try {
                    // Download and send the video
                    const stream = await downloadContentFromMessage(quotedVideo, 'video');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    
                    console.log(`[VV PLUGIN DEBUG] Video buffer size: ${buffer.length} bytes`);
                    
                    await conn.sendMessage(recipient, { 
                        video: buffer, 
                        caption: caption 
                    });
                    return;
                } catch (sendError) {
                    console.error(`[VV PLUGIN ERROR] Failed to send video:`, sendError);
                    reply('*❌ Failed to send video!*');
                    return;
                }
            } else if (quotedAudio) {
                console.log(`[VV PLUGIN DEBUG] Found view-once audio`);
                try {
                    // Download and send the audio
                    const stream = await downloadContentFromMessage(quotedAudio, 'audio');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                    
                    console.log(`[VV PLUGIN DEBUG] Audio buffer size: ${buffer.length} bytes`);
                    
                    await conn.sendMessage(recipient, { 
                        audio: buffer, 
                        mimetype: quotedAudio.mimetype || 'audio/ogg',
                        ptt: true
                    });
                    return;
                } catch (sendError) {
                    console.error(`[VV PLUGIN ERROR] Failed to send audio:`, sendError);
                    reply('*❌ Failed to send audio!*');
                    return;
                }
            } else {
                console.log(`[VV PLUGIN DEBUG] No view-once media found in direct message`);
                console.log(`[VV PLUGIN DEBUG] Image:`, !!quotedImage, `Video:`, !!quotedVideo, `Audio:`, !!quotedAudio);
                reply('*❌ Please reply to a view-once image, video, or audio message!*');
                return;
            }
        }
        
        // Handle nested view-once message structure
        const quoted = m.quoted.message || m.quoted.msg;
        
        // Look for view-once wrapper messages
        let actualMessage = null;
        if (quoted && quoted.viewOnceMessageV2) {
            actualMessage = quoted.viewOnceMessageV2.message;
            console.log(`[VV PLUGIN DEBUG] Found viewOnceMessageV2`);
        } else if (quoted && quoted.viewOnceMessage) {
            actualMessage = quoted.viewOnceMessage.message;
            console.log(`[VV PLUGIN DEBUG] Found viewOnceMessage`);
        } else if (quoted) {
            // Try direct access to media
            actualMessage = quoted;
            console.log(`[VV PLUGIN DEBUG] Trying direct access to media`);
        }
        
        // If still no actualMessage, try using the quoted object directly
        if (!actualMessage) {
            console.log(`[VV PLUGIN DEBUG] No nested message found, trying direct quoted object`);
            actualMessage = m.quoted;
        }
        
        if (!actualMessage) {
            console.log(`[VV PLUGIN DEBUG] No message found in quoted structure`);
            // Check if this is a messageSecret-only case (already viewed view-once)
            if (m.quoted.messageSecret && !m.quoted.message && !m.quoted.msg) {
                reply('*❌ This view-once message has already been viewed and cannot be recovered!*');
                return;
            }
            reply('*❌ No message content found in quoted message!*');
            return;
        }
        
        // Extract media from the actual message
        let quotedImage = actualMessage?.imageMessage;
        let quotedVideo = actualMessage?.videoMessage;
        let quotedAudio = actualMessage?.audioMessage;
        
        // If no nested media found, try direct properties
        if (!quotedImage && !quotedVideo && !quotedAudio) {
            const mimetype = actualMessage?.mimetype || actualMessage?.mtype;
            if (mimetype?.startsWith('image/')) {
                quotedImage = actualMessage;
            } else if (mimetype?.startsWith('video/')) {
                quotedVideo = actualMessage;
            } else if (mimetype?.startsWith('audio/')) {
                quotedAudio = actualMessage;
            }
        }
        
        // Check if this is a messageSecret-only case (already viewed view-once)
        if (!quotedImage && !quotedVideo && !quotedAudio && m.quoted.messageSecret && !m.quoted.message && !m.quoted.msg) {
            console.log(`[VV PLUGIN DEBUG] MessageSecret-only case detected`);
            reply('*❌ This view-once message has already been viewed and cannot be recovered!*');
            return;
        }

        // Set recipient
        let recipient = command === 'vv2' 
            ? botNumber
            : command === 'vv3' 
                ? ownerNumber
                : m.from;

        let caption = `> *❦ ════ •⊰❂ ZETECH-MD ❂⊱• ════ ❦*`;

        if (quotedImage && (quotedImage.viewOnce || quotedImage.viewOnceMessage || quotedImage.viewOnceMessageV2)) {
            console.log(`[VV PLUGIN DEBUG] Found view-once image`);
            // Download and send the image
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await conn.sendMessage(recipient, { 
                image: buffer, 
                fileName: 'zetech-media.jpg', 
                caption: quotedImage.caption || caption 
            }, { quoted: m });
            reply('*Image sent successfully!*');
        } else if (quotedVideo && (quotedVideo.viewOnce || quotedVideo.viewOnceMessage || quotedVideo.viewOnceMessageV2)) {
            console.log(`[VV PLUGIN DEBUG] Found view-once video`);
            // Download and send the video
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await conn.sendMessage(recipient, { 
                video: buffer, 
                fileName: 'zetech-media.mp4', 
                caption: quotedVideo.caption || caption 
            }, { quoted: m });
            reply('*Video sent successfully!*');
        } else if (quotedAudio && (quotedAudio.viewOnce || quotedAudio.viewOnceMessage || quotedAudio.viewOnceMessageV2)) {
            console.log(`[VV PLUGIN DEBUG] Found view-once audio`);
            // Download and send the audio
            const stream = await downloadContentFromMessage(quotedAudio, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await conn.sendMessage(recipient, { 
                audio: buffer, 
                fileName: 'zetech-media.ogg',
                mimetype: quotedAudio.mimetype || 'audio/ogg',
                ptt: true
            }, { quoted: m });
            reply('*Audio sent successfully!*');
        } else {
            console.log(`[VV PLUGIN DEBUG] No view-once media found.`);
            console.log(`[VV PLUGIN DEBUG] Quoted keys:`, Object.keys(quoted || {}));
            console.log(`[VV PLUGIN DEBUG] Actual message keys:`, Object.keys(actualMessage || {}));
            console.log(`[VV PLUGIN DEBUG] Image:`, !!quotedImage, `Video:`, !!quotedVideo, `Audio:`, !!quotedAudio);
            reply('*❌ Please reply to a view-once image, video, or audio message!*');
        }

    } catch (error) {
        console.error('[VV PLUGIN ERROR]:', error);
        reply('*❌ Failed to process View Once message!*');
    }
};

zetechplug.help = ['vv', 'vv2', 'vv3']
zetechplug.tags = ['owner']
zetechplug.command = ['vv', 'vv2', 'vv3']

module.exports = zetechplug;
