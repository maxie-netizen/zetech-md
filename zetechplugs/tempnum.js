// This plugin was created by God's Zeal TEch
// Don't Edit Or share without given me credits 

const axios = require('axios');

let trashplug = async (m, { conn, reply, text, args, reaction }) => {
    try {
        // React to the tempnum message
        try {
            await reaction(m.chat, "📱");
        } catch (error) {
            console.log('Failed to react to tempnum message:', error.message);
        }

        // Extract query from message
        const query = args.join(' ').trim();
        
        // Show help if no query provided
        if (!query) {
            const helpMessage = `┌ ❏ *⌜ TEMP NUMBER GUIDE ⌟* ❏
│
├◆ 📱 Get temporary numbers for verification
│
├◆ 💡 Usage: \`.tempnum <country-code>\`
├◆ 💡 Example: \`.tempnum us\`
│
├◆ 📌 *Note:* Use \`.templist\` to see available countries
├◆ 📌 *Note:* Use \`.otpbox <number>\` to check OTPs
└ ❏`;
            
            return reply(helpMessage);
        }
        
        const countryCode = query.toLowerCase();
        
        // Send processing message
        await reply(`📱 *Fetching temporary numbers for ${countryCode.toUpperCase()}...*`);
        
        try {
            // API call with validation
            const { data } = await axios.get(
                `https://api.vreden.my.id/api/tools/fakenumber/listnumber?id=${countryCode}`,
                { 
                    timeout: 10000
                }
            );

            // Validate response
            if (!data?.status || data.status !== 200 || !data?.result || !Array.isArray(data.result)) {
                console.error("Invalid API structure:", data);
                return reply(`┌ ❏ *⌜ API ERROR ⌟* ❏
│
├◆ ❌ Invalid API response format
├◆ 💡 Try: \`.tempnum us\`
└ ❏`);
            }

            if (data.result.length === 0) {
                return reply(`┌ ❏ *⌜ NO NUMBERS ⌟* ❏
│
├◆ ❌ No numbers available for *${countryCode.toUpperCase()}*
├◆ 💡 Try another country code
├◆ 💡 Use \`.templist\` to see available countries
└ ❏`);
            }

            // Process numbers
            const numbers = data.result.slice(0, 25);
            const numberList = numbers.map((num, i) => 
                `├◆ ${String(i+1).padStart(2, ' ')}. ${num.number}`
            ).join("\n");

            // Final message with OTP instructions
            const responseMessage = `┌ ❏ *⌜ TEMPORARY NUMBERS ⌟* ❏
│
├◆ 🌍 Country: ${countryCode.toUpperCase()}
├◆ 📋 Numbers Found: ${numbers.length}
│
${numberList}
│
├◆ 💡 *How to use:*
├◆ 1. Select a number from the list
├◆ 2. Use it for verification
├◆ 3. Check OTP with: \`.otpbox <number>\`
│
├◆ 💡 Example: \`.otpbox ${numbers[0].number}\`
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
            console.error("API Error:", apiError);
            
            if (apiError.code === "ECONNABORTED") {
                return reply(`┌ ❏ *⌜ REQUEST TIMEOUT ⌟* ❏
│
├◆ ⏳ API took too long to respond
├◆ 💡 Try smaller country codes like 'us', 'gb'
├◆ 💡 Use \`.templist\` to see available countries
└ ❏`);
            } else {
                return reply(`┌ ❏ *⌜ API ERROR ⌟* ❏
│
├◆ ❌ ${apiError.message}
├◆ 💡 Try: \`.tempnum us\`
├◆ 💡 Use \`.templist\` to see available countries
└ ❏`);
            }
        }

    } catch (error) {
        console.error('Tempnum Command Error:', error);
        
        const errorBox = `┌ ❏ *⌜ SYSTEM ERROR ⌟* ❏
│
├◆ ❌ Failed to process request
├◆ 🔍 Error: ${error.message.substring(0, 50)}...
└ ❏`;
        
        return reply(errorBox);
    }
};

trashplug.help = ['tempnum']
trashplug.tags = ['tools']
trashplug.command = ['tempnum']

module.exports = trashplug;
