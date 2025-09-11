const axios = require("axios");
let trashplug = async (m, { trashown,trashcore,q,reply }) => {

  if (!trashown) return reply(mess.owner)
    let target;

    // Jika ada mention
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
    } 
   
    else if (m.quoted && m.quoted.sender) {
        target = m.quoted.sender;
    } 
   
    else if (q) {
        const nomor = q.replace(/[^0-9]/g, '');
        target = nomor + '@s.whatsapp.net';
    } else {
        return m.reply(`</> Example: .getpp 254xxx / @tag 〽️`);
    }

    try {
        const pp = await trashcore.profilePictureUrl(target, 'image').catch(() => null);
        if (!pp) return m.reply(`</> profile picture is hidden/private.`);
        await trashcore.sendMessage(m.chat, {
            image: { url: pp },
            caption: `</> Success: ${target.split('@')[0]}`
        }, { quoted: m });
    } catch (err) {
        console.log(err);
        m.reply(`</> an error has occurred.`);
    }
};
trashplug.help = ['getdp']
trashplug.tags = ['dp']
trashplug.command = ['getpp']


module.exports=trashplug;