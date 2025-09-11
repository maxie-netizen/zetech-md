const axios = require('axios');
let trashplug = async (m, { trashcore, prefix,command,reply,text,mime,quoted,downloadContentFromMessage}) => {
if (!quoted) return reply(`reply Video/Image with Caption ${prefix + command}`)
if (/image/.test(mime)) {
let media = await quoted.download()
let encmedia = await trashcore.sendImageAsSticker(m.chat, media, m, {
packname: global.packname,
author: global.author
})
} else if (/video/.test(mime)) {
if ((quoted.msg || quoted).seconds > 31) return reply('maximum 30 seconds!')
let media = await quoted.download()
let encmedia = await trashcore.sendVideoAsSticker(m.chat, media, m, {
packname: global.packname,
author: global.author
})
} else {
return reply(`reply image/Video with Caption ${prefix + command}\nDuration Video 1-9 minutes`)
}
};
trashplug.help = ['s']
trashplug.tags = ['sticker']
trashplug.command = ['s']


module.exports = trashplug;