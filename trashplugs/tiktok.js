const axios = require("axios");
const fetch = require('node-fetch')
let trashplug = async (m, { text,reply,trashcore,prefix,command }) => {
    if (!text) return reply(`Example : ${prefix + command} link`);
    if (!text.includes('tiktok')) return m.reply(`Link Invalid!!`);
    reply(mess.wait);
    
    // Menggunakan fetch untuk akses API TikTok milikmu
    fetch(`https://api.tiklydown.eu.org/api/download/v5?url=${encodeURIComponent(text)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) return reply('Api error');
            
            // Mengambil URL video dan audio
        const title = `*Downloaded by ${botname}*`
            const videoUrl = data.result.play;
            const audioUrl = data.result.music;
            
            // send video and audio 
            trashcore.sendMessage(m.chat, { caption: title, video: { url: videoUrl }}, { quoted: m });
            trashcore.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mp4' }, { quoted: null });
        })
        .catch(err => reply(err.toString()));
};
trashplug.help = ['tt']
trashplug.tags = ['tiktok']
trashplug.command = ['tt']
 
module.exports = trashplug;