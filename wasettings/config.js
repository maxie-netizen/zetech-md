// Owner Setting
global.owner = ["254743518481",]
global.error = ["6666",]
global.ownername = "Maxwell"
//━━━━━━━━━━━━━━━━━━━━━━━━//
// Bot Setting
global.botname = "maxie-md"
global.botversion = "1.2.0"
global.typebot = "Plugin"
global.session = "trashsession"
global.connect = true
global.statusview = true
global.thumb = "https://files.catbox.moe/urnjdz.jpg"
global.wagc = "https://whatsapp.com/channel/0029VbB2Oro0lwgpSGvtrf25"
//━━━━━━━━━━━━━━━━━━━━━━━━//
// Sticker Marker
global.packname = "MAXIE-MD"
global.author = "©𝐏𝐚𝐂𝐊𝐒"
//━━━━━━━━━━━━━━━━━━━━━━━━//
// Respon Message
global.mess = {
    success: '✅ Done.',
    admin: '🚨 Admin only.',
    premium: '🆘must be a premium user.',
    botAdmin: '🤖 Make me admin first.',
    owner: '👑 Maxwell only.',
    OnlyGrup: '👥 Group only.',
    private: '📩 Private chat only.',
    wait: '⏳ Processing...',
    error: '⚠️ Error occurred.',
}
//━━━━━━━━━━━━━━━━━━━━━━━━//
// File Update
let fs = require('fs')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(`Update File 📁 : ${__filename}`)
delete require.cache[file]
require(file)
})
