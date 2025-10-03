let zetechplug = async (m, { conn, reply, text, args, command, reaction }) => {
    try {
        const searchQuery = text.trim();
        
        if (!searchQuery) {
            return reply("What song do you want to download?\n\n*Usage:* `.play song name`");
        }

        // React to the play message
        try {
            await reaction(m.chat, "🎵");
        } catch (error) {
            console.log('Failed to react to play message:', error.message);
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

        // Step 2: Download the audio using Keith API (dlmp3 endpoint for MP3 format)
        console.log(`[PLAY] Downloading from: https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(url)}`);
        
        const downloadResponse = await fetch(`https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(url)}`);
        
        if (!downloadResponse.ok) {
            console.error(`[PLAY] Download API failed with status: ${downloadResponse.status}`);
            throw new Error(`Download API failed with status: ${downloadResponse.status}`);
        }
        
        const downloadData = await downloadResponse.json();
        console.log(`[PLAY] Download API response:`, JSON.stringify(downloadData, null, 2));
        
        if (!downloadData.status || !downloadData.result || !downloadData.result.data) {
            console.error(`[PLAY] Invalid download response:`, downloadData);
            return reply("Failed to download audio. Please try again later.");
        }

        const audioData = downloadData.result.data;
        const audioUrl = audioData.downloadUrl;
        const creator = downloadData.creator || "Keithkeizzah";
        const audioTitle = audioData.title;
        const audioThumbnail = audioData.thumbnail;
        const audioDuration = audioData.duration;
        const audioQuality = audioData.quality || "128"; // Default quality if not provided
        
        console.log(`[PLAY] Download URL: ${audioUrl}`);
        console.log(`[PLAY] Audio Title: ${audioTitle}`);
        console.log(`[PLAY] Duration: ${audioDuration}s, Quality: ${audioQuality}kbps`);

        // Step 3: Send the audio with rich metadata
        let thumbnailBuffer = null;
        try {
            // Use the thumbnail from the audio API response (higher quality)
            const thumbnailUrl = audioThumbnail || thumbnail;
            thumbnailBuffer = await (await fetch(thumbnailUrl)).buffer();
        } catch (thumbError) {
            console.warn(`[PLAY] Failed to fetch thumbnail:`, thumbError.message);
        }
        
        // Since we're using dlmp3 endpoint, we always get MP3 files
        const mimetype = 'audio/mpeg';
        
        console.log(`[PLAY] Sending audio with mimetype: ${mimetype}`);
        
        // Format duration from seconds to MM:SS
        const formatDuration = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        
        // Prepare context info with audio-specific data
        const contextInfo = {
            forwardingScore: 1,
            isForwarded: true,
            externalAdReply: {
                title: audioTitle,
                body: `${formatDuration(audioDuration)} • ${audioQuality}kbps`,
                mediaUrl: url,
                mediaType: 2,
                renderLargerThumbnail: true,
                sourceUrl: url
            }
        };
        
        // Add thumbnail only if we successfully fetched it
        if (thumbnailBuffer) {
            contextInfo.externalAdReply.thumbnail = thumbnailBuffer;
        }
        
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: mimetype,
            fileName: `${audioTitle}.mp3`,
            ptt: true,
            contextInfo: contextInfo
        }, { quoted: m });

        console.log(`[PLAY] Successfully sent: ${audioTitle}`);

    } catch (error) {
        console.error('[PLAY ERROR] Error in play command:', error);
        reply("Download failed. Please try again later.");
    }
};

zetechplug.help = ['play']
zetechplug.tags = ['media']
zetechplug.command = ['play']

module.exports = zetechplug;
