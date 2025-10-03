// This plugin was created by God's Zeal TEch
// Don't Edit Or share without given me credits 

const axios = require('axios');

let trashplug = async (m, { conn, reply, reaction }) => {
    try {
        // React to the templist message
        try {
            await reaction(m.chat, "🌍");
        } catch (error) {
            console.log('Failed to react to templist message:', error.message);
        }

        // Send processing message
        await reply(`🌍 *Fetching available countries...*`);
        
        try {
            const { data } = await axios.get("https://api.vreden.my.id/api/tools/fakenumber/country", {
                timeout: 10000
            });

            if (!data?.status || data.status !== 200 || !data?.result || !Array.isArray(data.result)) {
                return reply(`┌ ❏ *⌜ COUNTRY LIST ERROR ⌟* ❏
│
├◆ ❌ Failed to fetch country list
├◆ 💡 Try again later
└ ❏`);
            }

            // Format countries in groups of 5 for better readability
            const countries = data.result;
            const totalCountries = countries.length;
            
            // Create formatted country list
            let countryList = '';
            for (let i = 0; i < countries.length; i += 5) {
                const chunk = countries.slice(i, i + 5);
                const line = chunk.map(c => `${c.title} (\`${c.id}\`)`).join(' | ');
                countryList += `├◆ ${line}\n`;
            }
            
            // Final message
            const responseMessage = `┌ ❏ *⌜ AVAILABLE COUNTRIES ⌟* ❏
│
├◆ 🌍 Total Countries: ${totalCountries}
│
${countryList}
│
├◆ 💡 *How to use:*
├◆ 1. Use \`.tempnum <country-code>\` to get numbers
├◆ 2. Example: \`.tempnum us\` for United States
└ ❏`;

            await conn.sendMessage(m.chat, {
                text: responseMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363269950668068@newsletter',
                        newsletterName: '❦ ════ •⊰❂ ZETECH-MD ❂⊱• ════ ❦',
                        serverMessageId: -1
                    }
                }
            });

        } catch (apiError) {
            console.error("Country List API Error:", apiError);
            
            const errorBox = `┌ ❏ *⌜ API ERROR ⌟* ❏
│
├◆ ❌ Failed to fetch country list
├◆ ⏳ ${apiError.code === "ECONNABORTED" ? "Request timed out" : "API connection error"}
├◆ 💡 Try again later
└ ❏`;
            
            return reply(errorBox);
        }

    } catch (error) {
        console.error('Templist Command Error:', error);
        
        const errorBox = `┌ ❏ *⌜ SYSTEM ERROR ⌟* ❏
│
├◆ ❌ Failed to process request
├◆ 🔍 Error: ${error.message.substring(0, 50)}...
└ ❏`;
        
        return reply(errorBox);
    }
};

trashplug.help = ['templist']
trashplug.tags = ['tools']
trashplug.command = ['templist']

module.exports = trashplug;
