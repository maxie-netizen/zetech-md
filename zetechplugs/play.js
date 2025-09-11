const yts = require('yt-search');
const axios = require('axios');

let zetechplug = async (m, { conn, reply, text, args, command }) => {
    try {
        const searchQuery = text.trim();
        
        if (!searchQuery) {
            return reply("What song do you want to download?\n\n*Usage:* `.play song name`");
        }

        // Send loading message
        await reply("_Please wait your download is in progress..._");

        // Search for the song
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return reply("No songs found!");
        }

        // Get the first video result
        const video = videos[0];
        const urlYt = video.url;

        console.log(`[PLAY] Searching for: ${searchQuery}`);
        console.log(`[PLAY] Found video: ${video.title} - ${urlYt}`);

        // Fetch audio data from API
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return reply("Failed to fetch audio from the API. Please try again later.");
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title;

        console.log(`[PLAY] Downloading: ${title}`);

        // Send the audio
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            caption: `🎵 *${title}*\n\n*Downloaded by Zetech-MD*`
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
