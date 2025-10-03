const axios = require('axios');

// Default AI states
let AI_STATE = {
    IB: "false", // Inbox chats
    GC: "false"  // Group chats
};

let trashplug = async (m, { conn, reply, text, args, trashown, reaction }) => {
    try {
        // React to the chatbot message
        try {
            await reaction(m.chat, "✅");
        } catch (error) {
            console.log('Failed to react to chatbot message:', error.message);
        }

        if (!trashown) {
            return reply("*📛 Only the owner can use this command!*");
        }

        const mode = args[0]?.toLowerCase();
        const target = args[1]?.toLowerCase();

        if (mode === "on") {
            if (!target || target === "all") {
                AI_STATE.IB = "true";
                AI_STATE.GC = "true";
                // Save to global database
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now enabled for both inbox and group chats");
            } else if (target === "ib") {
                AI_STATE.IB = "true";
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now enabled for inbox chats");
            } else if (target === "gc") {
                AI_STATE.GC = "true";
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now enabled for group chats");
            }
        } else if (mode === "off") {
            if (!target || target === "all") {
                AI_STATE.IB = "false";
                AI_STATE.GC = "false";
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now disabled for both inbox and group chats");
            } else if (target === "ib") {
                AI_STATE.IB = "false";
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now disabled for inbox chats");
            } else if (target === "gc") {
                AI_STATE.GC = "false";
                if (!global.db.data.chatbot) global.db.data.chatbot = {};
                global.db.data.chatbot.AI_STATE = JSON.stringify(AI_STATE);
                return reply("🤖 AI chatbot is now disabled for group chats");
            }
        } else {
            return reply(`- *ZETECH-MD -Chat-Bot Menu 👾*
*Enable Settings ✅*      
> .chatbot on all - Enable AI in all chats
> .chatbot on ib - Enable AI in inbox only
> .chatbot on gc - Enable AI in groups only
*Disable Settings ❌*
> .chatbot off all - Disable AI in all chats
> .chatbot off ib - Disable AI in inbox only
> .chatbot off gc - Disable AI in groups only`);
        }
    } catch (error) {
        console.error('Chatbot Command Error:', error);
        return reply("❌ Failed to process chatbot command.");
    }
};

trashplug.help = ['chatbot', 'aichat', 'dj', 'khanbot']
trashplug.tags = ['settings']
trashplug.command = ['chatbot', 'aichat', 'dj', 'khanbot']

module.exports = trashplug;
