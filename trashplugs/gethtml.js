const path = require('path')
const fs = require('fs')
let trashplug = async (m, {prefix, trashcore,reply,command,text }) => {
    if (!text) return reply(`Example: ${prefix + command} https://example.com`);

    try {
        let res = await fetch(text);
        if (!res.ok) return m.reply('❌ invalid url');
        let html = await res.text();

        const filePath = path.join(__dirname, '../library/lib/html_dump.html');
        fs.writeFileSync(filePath, html);

        await trashcore.sendMessage(m.chat, {
            document: fs.readFileSync(filePath),
            mimetype: 'text/html',
            fileName: 'results.html'
        }, { quoted: m });

        fs.unlinkSync(filePath); 
    } catch (e) {
        console.error(e);
        m.reply('❌ an error has occurred\n'+e.message);
    }
};
trashplug.help = ['getweb']
trashplug.tags = ['scweb']
trashplug.command = ['gethtml']


module.exports = trashplug;