const axios = require('axios');

let trashplug = async (m, { conn, reply, text, args, reaction }) => {
    try {
        // React to the gitclone message
        try {
            await reaction(m.chat, "📦");
        } catch (error) {
            console.log('Failed to react to gitclone message:', error.message);
        }

        if (!args[0]) {
            return reply("❌ Where is the GitHub link?\n\nExample:\n.gitclone https://github.com/username/repository");
        }

        if (!/^(https:\/\/)?github\.com\/.+/.test(args[0])) {
            return reply("⚠️ Invalid GitHub link. Please provide a valid GitHub repository URL.");
        }

        try {
            const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/i;
            const match = args[0].match(regex);

            if (!match) {
                throw new Error("Invalid GitHub URL.");
            }

            const [, username, repo] = match;
            const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

            // Check if repository exists
            const response = await axios.head(zipUrl);
            if (response.status !== 200) {
                throw new Error("Repository not found.");
            }

            const contentDisposition = response.headers["content-disposition"];
            const fileName = contentDisposition ? contentDisposition.match(/filename=(.*)/)[1] : `${repo}.zip`;

            // Notify user of the download
            await reply(`📥 *Downloading repository...*\n\n*Repository:* ${username}/${repo}\n*Filename:* ${fileName}\n\n> *Powered by ZETECH-MD*`);

            // Send the zip file to the user
            await conn.sendMessage(m.chat, {
                document: { url: zipUrl },
                fileName: fileName,
                mimetype: 'application/zip',
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363269950668068@newsletter',
                        newsletterName: '❦ ════ •⊰❂ ZETECH-MD ❂⊱• ════ ❦',
                        serverMessageId: -1
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error("Error:", error);
            return reply("❌ Failed to download the repository. Please try again later.");
        }

    } catch (error) {
        console.error('Gitclone Command Error:', error);
        return reply("❌ Failed to process gitclone command.");
    }
};

trashplug.help = ['gitclone', 'git']
trashplug.tags = ['downloader']
trashplug.command = ['gitclone', 'git']

module.exports = trashplug;
