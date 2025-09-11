let zetechplug = async (m, { conn, reply, text, args, command }) => {
    try {
        const searchQuery = text.trim();
        
        if (!searchQuery) {
            return reply("What song do you want to download?\n\n*Usage:* `.play song name`");
        }

        // Send loading message
        await reply("_Please wait your download is in progress..._");

        console.log(`[PLAY] Searching for: ${searchQuery}`);

        // Try multiple APIs for better reliability
        let success = false;
        
        // API 1: Ochinpo Helper
        try {
            let res = await fetch(`https://ochinpo-helper.hf.space/yt?query=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                let json = await res.json();
                if (json.success && json.result) {
                    const { title, url, image, duration, author, download } = json.result;
                    const thumbnail = await (await fetch(image)).buffer();
                    
                    await conn.sendMessage(m.chat, {
                        audio: { url: download.audio },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`,
                        ptt: true,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            externalAdReply: {
                                title,
                                body: `${author.name} • ${duration.timestamp}`,
                                thumbnail,
                                mediaUrl: url,
                                mediaType: 2,
                                renderLargerThumbnail: true,
                                sourceUrl: url
                            }
                        }
                    }, { quoted: m });
                    success = true;
                }
            }
        } catch (e) {
            console.warn('[PLAY] Ochinpo API failed:', e.message);
        }

        // API 2: Nekorinn (Fallback)
        if (!success) {
            try {
                let res = await fetch(`https://api.nekorinn.my.id/downloader/ytplay-savetube?q=${encodeURIComponent(searchQuery)}`);
                let data = await res.json();
                if (data.status && data.result) {
                    const { title, channel, duration, imageUrl, link } = data.result.metadata;
                    const downloadUrl = data.result.downloadUrl;
                    const thumbnail = await (await fetch(imageUrl)).buffer();
                    
                    await conn.sendMessage(m.chat, {
                        audio: { url: downloadUrl },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`,
                        ptt: true,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            externalAdReply: {
                                title,
                                body: `${channel} • ${duration}`,
                                thumbnail,
                                mediaUrl: link,
                                mediaType: 2,
                                renderLargerThumbnail: true,
                                sourceUrl: link
                            }
                        }
                    }, { quoted: m });
                    success = true;
                }
            } catch (e) {
                console.warn('[PLAY] Nekorinn API failed:', e.message);
            }
        }

        // API 3: Diioffc (Final fallback)
        if (!success) {
            try {
                const res = await fetch(`https://api.diioffc.web.id/api/search/ytplay?query=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.status && json.result) {
                        const { title, author, duration, thumbnail: thumb, url, download } = json.result;
                        const thumbnail = await (await fetch(thumb)).buffer();

                        await conn.sendMessage(m.chat, {
                            audio: { url: download.url },
                            mimetype: 'audio/mpeg',
                            fileName: download.filename || `${title}.mp3`,
                            ptt: true,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                externalAdReply: {
                                    title,
                                    body: `${author.name} • ${duration.timestamp}`,
                                    thumbnail,
                                    mediaUrl: url,
                                    mediaType: 2,
                                    renderLargerThumbnail: true,
                                    sourceUrl: url
                                }
                            }
                        }, { quoted: m });
                        success = true;
                    }
                }
            } catch (e) {
                console.warn('[PLAY] Diioffc API failed:', e.message);
            }
        }

        if (!success) {
            reply("All APIs failed. Please try again later or try a different song name.");
        }

    } catch (error) {
        console.error('[PLAY ERROR] Error in play command:', error);
        reply("Download failed. Please try again later.");
    }
};

zetechplug.help = ['play']
zetechplug.tags = ['media']
zetechplug.command = ['play']

module.exports = zetechplug;
