const axios = require('axios');

let zetechplug = async (m, { conn, reply, text, args, command }) => {
    try {
        const searchQuery = text.trim();
        
        if (!searchQuery) {
            return reply("What song do you want to download?\n\n*Usage:* `.play song name`");
        }

        // Send loading message
        await reply("_Please wait your download is in progress..._");

        console.log(`[PLAY] Searching for: ${searchQuery}`);

        // Use Keith API to search and download directly
        const response = await axios.get(`https://apis-keith.vercel.app/download/audio?url=${searchQuery}`);
        const data = response.data;

        if (!data || !data.status || !data.result) {
            return reply("Failed to fetch audio from the API. Please try again later.");
        }

        const audioUrl = data.result;
        const creator = data.creator || "Unknown";

        console.log(`[PLAY] Downloading from: ${audioUrl}`);

        // Send the audio
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${searchQuery}.mp3`,
            caption: `🎵 *${searchQuery}*\n\n*Downloaded by Zetech-MD*\n*API by ${creator}*`
        }, { quoted: m });

    } catch (error) {
        console.error('[PLAY ERROR] Error in play command:', error);
        reply("Download failed. Please try again later.");
    }
};

zetechplug.help = ['play']
zetechplug.tags = ['media']
zetechplug.command = ['play']

module.exports = zetechplug;
