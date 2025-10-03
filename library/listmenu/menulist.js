const chalk = require('chalk')
const fs = require('fs')

// Create a clean WhatsApp-friendly menu without ANSI color codes
const Menu = `
╔═══════════════════════════════════════════════════╗
║  🩸⃟‣ZETECH-MD-𝐂𝐋𝐈𝐄𝐍𝐓≈🚭  ║
╠═══════════════════════════════════════════════════╣
║   ✦ Owner: Maxwell     ║
║   ✦ Version: 1.5.0                     ║
║   ✦ Type: Plugin       ║
╚═══════════════════════════════════════════════════╝

├────────────────────────────❖────────────────────────────┤
〘 𝕄𝔸𝕀ℕ ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ menu           ◈ ping
 ◈ ping2          ◈ uptime
 ◈ s              ◈ botinfo
 ◈ listplugin     ◈ update

├────────────────────────────❖────────────────────────────┤
〘 𝔹𝕆𝕋 ℂ𝕆ℕ𝕋ℝ𝕆𝕃 〙
 ◈ public         ◈ private
 ◈ addaccess      ◈ delaccess
 ◈ autoreact      ◈ block
 ◈ autotyping     ◈ autorecord
 ◈ autorecording  ◈ autobio
 ◈ alwaysonline   ◈ autostatus
 ◈ chatbot        ◈ aichat
 ◈ cloudsync      ◈ cloud
 ◈ $              ◈ menu

├────────────────────────────❖────────────────────────────┤
〘 𝕄𝔼𝔻𝕀𝔸 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ play           ◈ ytmp4
 ◈ ytvid          ◈ yts
 ◈ pinterestdl    ◈ retrieve
 ◈ song           ◈ twitterdl
 ◈ tt             ◈ tiktok
 ◈ igdl           ◈ ytmp3
 ◈ tg             ◈ telegram

├────────────────────────────❖────────────────────────────┤
〘 𝔹𝕌𝔾 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ zetech

├────────────────────────────❖────────────────────────────┤
〘 𝕍𝕀𝔼𝕎-𝕆ℕℂ𝔼 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ vv (reply to view once)
 ◈ vv2 (send to bot)
 ◈ vv3 (send to owner)
 ◈ emoji reply (secret mode)

├────────────────────────────❖────────────────────────────┤
〘 𝔸𝕀 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ gemma          ◈ indo-ai

├────────────────────────────❖────────────────────────────┤
〘 𝔾𝔼𝕋 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ gethtml        ◈ getpp
 ◈ getplugin      ◈ save
 ◈ gitclone       ◈ weather
 ◈ groups         ◈ mychats
 ◈ tempnum        ◈ templist
 ◈ otpbox         ◈ tools

├────────────────────────────❖────────────────────────────┤
〘 𝔾ℝ𝕆𝕌ℙ ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ add            ◈ remove
 ◈ promote        ◈ revoke
 ◈ approve        ◈ reject
 ◈ antilinkgc     ◈ antilink
 ◈ antilinkstatus ◈ antilinkget
 ◈ tagall         ◈ hidetag
 ◈ close          ◈ open
 ◈ kickall        ◈ linkgc
 ◈ setppgc        ◈ setdesc
 ◈ tagme

├────────────────────────────❖────────────────────────────┤
〘 𝕋𝕆𝕆𝕃𝕊 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ enc            ◈ idch
 ◈ dev

├────────────────────────────❖────────────────────────────┤
〘 𝔼ℙℍ𝕆𝕋𝕆 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙
 ◈ glithtext      ◈ lighteffects
 ◈ writetext      ◈ advancedglow
 ◈ typographytext ◈ pixelglitch
 ◈ neonglitch     ◈ flagtext
 ◈ flag3dtext     ◈ deletingtext
 ◈ blackpinkstyle ◈ glowingtex
 ◈ underwater     ◈ logomaker
 ◈ cartoonstyle   ◈ papercutstyle
 ◈ watercolortext ◈ effectclouds
 ◈ blackpinklogo  ◈ gradienttext
 ◈ luxurygold     ◈ sandsummer
 ◈ multicoloredneon ◈ galaxywallpaper
 ◈ 1917style      ◈ galaxystyle
 ◈ royaltext      ◈ freecreate

╔═══════════════════════════════════════════════════╗
║  Type .menu <category> for specific commands  ║
╚═══════════════════════════════════════════════════╝
`;

module.exports = Menu;
let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})