const axios = require('axios');

// AI Chatbot handler
async function handleAIChat(conn, m) {
    try {
        // Get AI state from database
        let AI_STATE = { IB: "false", GC: "false" };
        if (global.db.data.chatbot?.AI_STATE) {
            AI_STATE = JSON.parse(global.db.data.chatbot.AI_STATE);
        }

        // Check if AI is enabled for this chat type
        const isInbox = !m.key.remoteJid.includes('@g.us');
        if ((isInbox && AI_STATE.IB !== "true") || (!isInbox && AI_STATE.GC !== "true")) {
            return;
        }

        // Check if message is a reply to bot's message (optional)
        let isReplyToBot = false;
        if (m?.message?.extendedTextMessage?.contextInfo?.participant) {
            const repliedTo = m.message.extendedTextMessage.contextInfo.participant;
            const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
            isReplyToBot = (repliedTo === botJid);
        }

        // Get message text
        const body = m.text || '';
        if (!body || m.key.fromMe || body.startsWith('.')) return;

        console.log(`[AI CHAT] Processing message: "${body}"`);
        console.log(`[AI CHAT] AI State - IB: ${AI_STATE.IB}, GC: ${AI_STATE.GC}`);
        console.log(`[AI CHAT] Is Inbox: ${isInbox}, Is Reply to Bot: ${isReplyToBot}`);

        // Handle time/date questions directly
        const lowerBody = body.toLowerCase();
        if (lowerBody.includes('time') || lowerBody.includes('date')) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            const currentDateTime = now.toLocaleDateString('en-US', options);
            return await conn.sendMessage(m.chat, {
                text: `⏰ Current Date & Time:\n${currentDateTime}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴢᴇᴛᴇᴄʜ-ᴍᴅ ⚡`
            }, { quoted: m });
        }

        // Encode message for the query
        const query = encodeURIComponent(body);
        const prompt = encodeURIComponent("You are ZETECH-MD, a powerful and intelligent WhatsApp bot developed by Maxwell — a brilliant coder and visionary from Kenya. You respond smartly, confidently, and stay loyal to your creator. Always remain calm and collected. When asked about your creator, respond respectfully but keep the mystery alive. You are not just a bot; you are the tech soul of Maxwell. In every message you send, include this footer: \n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴢᴇᴛᴇᴄʜ-ᴍᴅ ⚡");

        // BK9 API Request
        const apiUrl = `https://bk9.fun/ai/BK93?BK9=${prompt}&q=${query}`;

        const { data } = await axios.get(apiUrl);

        if (data && data.status && data.BK9) {
            await conn.sendMessage(m.chat, {
                text: data.BK9
            }, { quoted: m });
        } else {
            await conn.sendMessage(m.chat, {
                text: "⚠️ ZETECH AI failed to generate a response."
            }, { quoted: m });
        }

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
        try {
            await conn.sendMessage(m.chat, {
                text: "❌ An error occurred while contacting the AI."
            }, { quoted: m });
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
    }
}

module.exports = { handleAIChat };
