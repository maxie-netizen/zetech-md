// This plugin was created by God's Zeal TEch
// Don't Edit Or share without given me credits 

const axios = require('axios');

let trashplug = async (m, { conn, reply, text, args, reaction }) => {
    try {
        // React to the otpbox message
        try {
            await reaction(m.chat, "🔑");
        } catch (error) {
            console.log('Failed to react to otpbox message:', error.message);
        }

        // Extract query from message
        const query = args.join(' ').trim();
        
        // Show help if no query provided
        if (!query) {
            const helpMessage = `┌ ❏ *⌜ OTP CHECK GUIDE ⌟* ❏
│
├◆ 🔑 Check OTP messages for temporary numbers
│
├◆ 💡 Usage: \`.otpbox <full-number>\`
├◆ 💡 Example: \`.otpbox +1234567890\`
│
├◆ 📌 *Note:* Get numbers first with \`.tempnum <country-code>\`
└ ❏`;
            
            return reply(helpMessage);
        }
        
        const phoneNumber = query.trim();
        
        // Validate phone number format
        if (!phoneNumber.startsWith("+")) {
            return reply(`┌ ❏ *⌜ INVALID NUMBER ⌟* ❏
│
├◆ ❌ Invalid phone number format
├◆ 💡 Number must start with '+' (e.g., +1234567890)
├◆ 💡 Use \`.tempnum <country-code>\` to get valid numbers
└ ❏`);
        }
        
        // Send processing message
        await reply(`🔑 *Checking OTP for ${phoneNumber}...*`);
        
        try {
            // Fetch OTP messages
            const { data } = await axios.get(
                `https://api.vreden.my.id/api/tools/fakenumber/message?nomor=${encodeURIComponent(phoneNumber)}`,
                { 
                    timeout: 10000
                }
            );

            // Validate response
            if (!data?.status || data.status !== 200 || !data?.result || !Array.isArray(data.result)) {
                return reply(`┌ ❏ *⌜ NO OTP MESSAGES ⌟* ❏
│
├◆ ❌ No OTP messages found for this number
├◆ 💡 Verify number is from \`.tempnum\` results
├◆ 💡 Wait a few moments if recently requested
└ ❏`);
            }

            if (data.result.length === 0) {
                return reply(`┌ ❏ *⌜ NO OTP MESSAGES ⌟* ❏
│
├◆ 🕒 No OTP messages yet for this number
├◆ 💡 Wait a few moments and try again
├◆ 💡 Verify the number was used for verification
└ ❏`);
            }

            // Format OTP messages
            const otpMessages = data.result.map(msg => {
                // Extract OTP code (matches common OTP patterns)
                const otpMatch = msg.content.match(/\b\d{4,8}\b/g);
                const otpCode = otpMatch ? otpMatch[0] : "Not found";
                
                return `├◆ ┌───────────────────
├◆ │ *From:* ${msg.from || "Unknown"}
├◆ │ *Code:* ${otpCode}
├◆ │ *Time:* ${msg.time_wib || msg.timestamp}
├◆ │ *Message:* ${msg.content.substring(0, 40)}${msg.content.length > 40 ? "..." : ""}
├◆ └───────────────────`;
            }).join("\n");

            const responseMessage = `┌ ❏ *⌜ OTP MESSAGES ⌟* ❏
│
├◆ 📱 Number: ${phoneNumber}
├◆ 📬 Messages Found: ${data.result.length}
│
${otpMessages}
│
├◆ 💡 *How to use:*
├◆ 1. Copy the OTP code from messages
├◆ 2. Enter it on the verification page
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
            console.error("OTP Check Error:", apiError);
            
            const errorBox = `┌ ❏ *⌜ OTP CHECK ERROR ⌟* ❏
│
├◆ ❌ ${apiError.code === "ECONNABORTED" ? "Request timed out" : "Failed to check OTP"}
├◆ ⏳ Try again later
├◆ 💡 Verify the number is correct
└ ❏`;
            
            return reply(errorBox);
        }

    } catch (error) {
        console.error('OTPbox Command Error:', error);
        
        const errorBox = `┌ ❏ *⌜ SYSTEM ERROR ⌟* ❏
│
├◆ ❌ Failed to process request
├◆ 🔍 Error: ${error.message.substring(0, 50)}...
└ ❏`;
        
        return reply(errorBox);
    }
};

trashplug.help = ['otpbox']
trashplug.tags = ['tools']
trashplug.command = ['otpbox']

module.exports = trashplug;
