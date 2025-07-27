const chalk = require('chalk')
const fs = require('fs')
const Menu = `╭─⊷MAXIE-MD─
│▢ Owner:${global.ownername}
│▢ Version: 1.5.0
│▢ Type: ${global.typebot}
╰────────────
╭─⊷🐦‍🔥MAIN-CMD─
│ • menu                    
│ • ping
│ • ping2
│ • uptime 
│ • s
│ • botinfo
│ • listplugin 
│ • update 
╰────────────
╭─⊷🗿CTRL-BOT─
│ • public                    
│ • private
│ • addaccess
│ • delaccess    
│ • autoreact    
│ • block
│ • autotyping
│ • autorecord 
│ • autobio
│ • >
│ • $
╰────────────
╭─⊷🏓MEDIA-CMD─
│ • play       
│ • ytmp4 
│ • ytvid 
│ • yts 
│ • pinterestdl 
│ • retrieve
│ • song
│ • twitterdl
│ • tt
│ • tiktok  
│ • igdl      
│ • ytmp3      
╰────────────
╭─⊷💀BUG-CMD─
│ • trash                    
╰────────────
╭─⊷🤖AI-CMD─
│ • gemma 
│ • indo-ai        
╰────────────
╭─⊷⚡GET-CMD─
│ • gethtml
│ • getpp 
│ • getplugin 
│ • save
│ • gitclone
│ • weather 
╰────────────
╭─⊷👥GRUP-CMD─
│ • add
│ • remove
│ • promote
│ • revoke
│ • approve
│ • reject
│ • antilinkgc
│ • antilink
│ • tagall
│ • hidetag
│ • close
│ • open
│ • kickall
│ • linkgc
│ • setppgc
│ • setdesc
│ • tagme
╰────────────
╭─⊷⚓TOOL-CMD─
│ • enc
│ • idch 
│ • dev
╰────────────
╭─⊷🩸EPHOTO-CMD─
│ • glithtext
│ • lighteffects 
│ • writetext
│ • advancedglow
│ • typographytext
│ • pixelglitch
│ • neonglitch 
│ • flagtext
│ • flag3dtext
│ • deletingtext
│ • blackpinkstyle
│ • glowingtex
│ • underwater 
│ • logomaker
│ • cartoonstyle
│ • papercutstyle
│ • watercolortext
│ • effectclouds
│ • blackpinklogo
│ • gradienttext
│ • luxurygold
│ • sandsummer
│ • multicoloredneon
│ • galaxywallpaper 
│ • 1917style
│ • galaxystyle
│ • royaltext
│ • freecreate
╰────────────`

module.exports = Menu
let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
