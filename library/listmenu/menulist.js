const chalk = require('chalk')
const fs = require('fs')

// Define stylish fonts and visual elements
const titleStyle = chalk.hex('#FF5733').bold.underline;
const categoryStyle = chalk.hex('#3498DB').bold;
const commandStyle = chalk.hex('#2ECC71');
const highlightStyle = chalk.hex('#F1C40F').bold;
const noteStyle = chalk.hex('#9B59B6').italic;
const separator = chalk.hex('#95A5A6')('├' + '─'.repeat(28) + '❖' + '─'.repeat(28) + '┤');

const Menu = `
${chalk.hex('#FF6B6B')('╔═══════════════════════════════════════════════════╗')}
${chalk.hex('#FF6B6B')('║')}  ${titleStyle('Z E T E C H - M D')} ${chalk.hex('#FF6B6B')('║')}
${chalk.hex('#FF6B6B')('╠═══════════════════════════════════════════════════╣')}
${chalk.hex('#FF6B6B')('║')}   ${chalk.hex('#FFD700')('✦')} ${chalk.white('Owner:')} ${highlightStyle(global.ownername || 'Not set')}     ${chalk.hex('#FF6B6B')('║')}
${chalk.hex('#FF6B6B')('║')}   ${chalk.hex('#FFD700')('✦')} ${chalk.white('Version:')} ${highlightStyle('1.5.0')}                     ${chalk.hex('#FF6B6B')('║')}
${chalk.hex('#FF6B6B')('║')}   ${chalk.hex('#FFD700')('✦')} ${chalk.white('Type:')} ${highlightStyle(global.typebot || 'Not set')}       ${chalk.hex('#FF6B6B')('║')}
${chalk.hex('#FF6B6B')('╚═══════════════════════════════════════════════════╝')}

${separator}
${categoryStyle('〘 𝕄𝔸𝕀ℕ ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('menu')}           ${chalk.hex('#FFD700')('◈')} ${commandStyle('ping')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('ping2')}          ${chalk.hex('#FFD700')('◈')} ${commandStyle('uptime')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('s')}              ${chalk.hex('#FFD700')('◈')} ${commandStyle('botinfo')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('listplugin')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('update')}

${separator}
${categoryStyle('〘 𝔹𝕆𝕋 ℂ𝕆ℕ𝕋ℝ𝕆𝕃 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('public')}         ${chalk.hex('#FFD700')('◈')} ${commandStyle('private')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('addaccess')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('delaccess')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('autoreact')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('block')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('autotyping')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('autorecord')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('autobio')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('alwaysonline')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('>')}              ${chalk.hex('#FFD700')('◈')} ${commandStyle('$')}

${separator}
${categoryStyle('〘 𝕄𝔼𝔻𝕀𝔸 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('play')}           ${chalk.hex('#FFD700')('◈')} ${commandStyle('ytmp4')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('ytvid')}          ${chalk.hex('#FFD700')('◈')} ${commandStyle('yts')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('pinterestdl')}    ${chalk.hex('#FFD700')('◈')} ${commandStyle('retrieve')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('song')}           ${chalk.hex('#FFD700')('◈')} ${commandStyle('twitterdl')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('tt')}             ${chalk.hex('#FFD700')('◈')} ${commandStyle('tiktok')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('igdl')}           ${chalk.hex('#FFD700')('◈')} ${commandStyle('ytmp3')}

${separator}
${categoryStyle('〘 𝔹𝕌𝔾 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('zetech')}

${separator}
${categoryStyle('〘 𝕍𝕀𝔼𝕎-𝕆ℕℂ𝔼 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('vv')} ${chalk.white('(reply to view once)')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('vv2')} ${chalk.white('(send to bot)')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('vv3')} ${chalk.white('(send to owner)')}
 ${chalk.hex('#FFD700')('◈')} ${chalk.white('emoji reply')} ${noteStyle('(secret mode)')}

${separator}
${categoryStyle('〘 𝔸𝕀 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('gemma')}          ${chalk.hex('#FFD700')('◈')} ${commandStyle('indo-ai')}

${separator}
${categoryStyle('〘 𝔾𝔼𝕋 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('gethtml')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('getpp')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('getplugin')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('save')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('gitclone')}       ${chalk.hex('#FFD700')('◈')} ${commandStyle('weather')}

${separator}
${categoryStyle('〘 𝔾ℝ𝕆𝕌ℙ ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('add')}            ${chalk.hex('#FFD700')('◈')} ${commandStyle('remove')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('promote')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('revoke')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('approve')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('reject')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('antilinkgc')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('antilink')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('tagall')}         ${chalk.hex('#FFD700')('◈')} ${commandStyle('hidetag')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('close')}          ${chalk.hex('#FFD700')('◈')} ${commandStyle('open')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('kickall')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('linkgc')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('setppgc')}        ${chalk.hex('#FFD700')('◈')} ${commandStyle('setdesc')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('tagme')}

${separator}
${categoryStyle('〘 𝕋𝕆𝕆𝕃𝕊 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('enc')}            ${chalk.hex('#FFD700')('◈')} ${commandStyle('idch')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('dev')}

${separator}
${categoryStyle('〘 𝔼ℙℍ𝕆𝕋𝕆 ℂ𝕆𝕄𝕄𝔸ℕ𝔻𝕊 〙')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('glithtext')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('lighteffects')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('writetext')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('advancedglow')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('typographytext')} ${chalk.hex('#FFD700')('◈')} ${commandStyle('pixelglitch')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('neonglitch')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('flagtext')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('flag3dtext')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('deletingtext')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('blackpinkstyle')} ${chalk.hex('#FFD700')('◈')} ${commandStyle('glowingtex')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('underwater')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('logomaker')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('cartoonstyle')}   ${chalk.hex('#FFD700')('◈')} ${commandStyle('papercutstyle')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('watercolortext')} ${chalk.hex('#FFD700')('◈')} ${commandStyle('effectclouds')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('blackpinklogo')}  ${chalk.hex('#FFD700')('◈')} ${commandStyle('gradienttext')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('luxurygold')}     ${chalk.hex('#FFD700')('◈')} ${commandStyle('sandsummer')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('multicoloredneon')} ${chalk.hex('#FFD700')('◈')} ${commandStyle('galaxywallpaper')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('1917style')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('galaxystyle')}
 ${chalk.hex('#FFD700')('◈')} ${commandStyle('royaltext')}      ${chalk.hex('#FFD700')('◈')} ${commandStyle('freecreate')}

${chalk.hex('#FF6B6B')('╔═══════════════════════════════════════════════════╗')}
${chalk.hex('#FF6B6B')('║')}  ${noteStyle('Type .menu <category> for specific commands')}  ${chalk.hex('#FF6B6B')('║')}
${chalk.hex('#FF6B6B')('╚═══════════════════════════════════════════════════╝')}
`;

module.exports = Menu;
let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})