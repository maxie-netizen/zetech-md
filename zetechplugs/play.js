let zetechplug = async (m, { conn, reply, text, args, command }) => {
    try {
        const searchQuery = text.trim();
        
        if (!searchQuery) {
            return reply("What song do you want to download?\n\n*Usage:* `.play song name`");
        }

        // Send loading message
        await reply("_Please wait your download is in progress..._");

        console.log(`[PLAY] Searching for: ${searchQuery}`);

        // Step 1: Search for the song using Keith API
        const searchResponse = await fetch(`https://apis-keith.vercel.app/search/yts?query=${encodeURIComponent(searchQuery)}`);
        
        if (!searchResponse.ok) {
            throw new Error('Search API failed');
        }
        
        const searchData = await searchResponse.json();
        
        if (!searchData.status || !searchData.result || searchData.result.length === 0) {
            return reply("No songs found. Please try a different search term.");
        }

        // Get the first result (most relevant)
        const firstResult = searchData.result[0];
        const { title, url, thumbnail, duration, views } = firstResult;
        
        console.log(`[PLAY] Found: ${title}`);
        console.log(`[PLAY] YouTube URL: ${url}`);

        // Step 2: Download the audio using Keith API
        const downloadResponse = await fetch(`https://apis-keith.vercel.app/download/audio?url=${encodeURIComponent(url)}`);
        
        if (!downloadResponse.ok) {
            throw new Error('Download API failed');
        }
        
        const downloadData = await downloadResponse.json();
        
        if (!downloadData.status || !downloadData.result) {
            return reply("Failed to download audio. Please try again later.");
        }

        const audioUrl = downloadData.result;
        const creator = downloadData.creator || "Keithkeizzah";
        
        console.log(`[PLAY] Download URL: ${audioUrl}`);

        // Step 3: Send the audio with rich metadata
        const thumbnailBuffer = await (await fetch(thumbnail)).buffer();
        
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: true,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: title,
                    body: `${duration} • ${views} views`,
                    thumbnail: thumbnailBuffer,
                    mediaUrl: url,
                    mediaType: 2,
                    renderLargerThumbnail: true,
                    sourceUrl: url
                }
            }
        }, { quoted: m });

        console.log(`[PLAY] Successfully sent: ${title}`);

    } catch (error) {
        console.error('[PLAY ERROR] Error in play command:', error);
        reply("Download failed. Please try again later.");
    }
};

zetechplug.help = ['play']
zetechplug.tags = ['media']
zetechplug.command = ['play']

module.exports = zetechplug;
