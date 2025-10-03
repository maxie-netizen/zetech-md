const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

// Create temp directory if it doesn't exist
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

const delay = time => new Promise(res => setTimeout(res, time));

let trashplug = async (m, { conn, reply, text, reaction }) => {
    try {
        // React to the tg message
        try {
            await reaction(m.chat, "📦");
        } catch (error) {
            console.log('Failed to react to tg message:', error.message);
        }

        // Get the URL from message
        const messageText = m.text || '';
        const args = messageText.split(' ').slice(1);
        
        console.log(`[TG DEBUG] Message text: "${messageText}"`);
        console.log(`[TG DEBUG] Args:`, args);
        
        if (!args[0]) {
            return reply('⚠️ Please enter the Telegram sticker URL!\n\nExample: .tg https://t.me/addstickers/Porcientoreal');
        }

        // Validate URL format
        if (!args[0].match(/(https:\/\/t.me\/addstickers\/)/gi)) {
            return reply('❌ Invalid URL! Make sure it\'s a Telegram sticker URL.');
        }

        // Get pack name from URL
        const packName = args[0].replace("https://t.me/addstickers/", "");

        // Using working bot token (try multiple tokens if needed)
        const botTokens = [
            '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4',
            '2130318464:AAHdQOUNBx72cZfZc2lS_0iPJ2xYyv5Xqk',
            '2130318464:AAHdQOUNBx72cZfZc2lS_0iPJ2xYyv5Xqk'
        ];
        const botToken = botTokens[0]; // Use first token for now
        
        console.log(`[TG DEBUG] Bot token: ${botToken.substring(0, 10)}...`);
        console.log(`[TG DEBUG] Pack name: ${packName}`);
        
        try {
            // Test bot token first
            const testResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
            const testData = testResponse.data;
            console.log(`[TG DEBUG] Bot info:`, testData);
            
            if (!testData.ok) {
                throw new Error(`Bot token invalid: ${testData.description}`);
            }
            
            // Fetch sticker pack info
            const response = await axios.get(
                `https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`,
                { 
                    headers: {
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0"
                    }
                }
            );

            const stickerSet = response.data;
            
            console.log(`[TG DEBUG] API Response:`, JSON.stringify(stickerSet, null, 2));
            
            if (!stickerSet.ok || !stickerSet.result) {
                console.error(`[TG ERROR] API Error:`, stickerSet);
                throw new Error(`API Error: ${stickerSet.description || 'Invalid sticker pack or API response'}`);
            }

            // Send initial message with sticker count
            await reply(`📦 Found ${stickerSet.result.stickers.length} stickers\n⏳ Starting download...`);

            // Process each sticker
            let successCount = 0;
            for (let i = 0; i < stickerSet.result.stickers.length; i++) {
                try {
                    const sticker = stickerSet.result.stickers[i];
                    const fileId = sticker.file_id;
                    
                    // Get file path
                    const fileInfo = await axios.get(
                        `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
                    );
                    
                    const fileData = fileInfo.data;
                    if (!fileData.ok || !fileData.result.file_path) continue;

                    // Download sticker
                    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                    const imageResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
                    const imageBuffer = Buffer.from(imageResponse.data);

                    // Generate temp file paths
                    const tempInput = path.join(tmpDir, `temp_${Date.now()}_${i}`);
                    const tempOutput = path.join(tmpDir, `sticker_${Date.now()}_${i}.webp`);

                    // Write media to temp file
                    fs.writeFileSync(tempInput, imageBuffer);

                    // Check if sticker is animated or video
                    const isAnimated = sticker.is_animated || sticker.is_video;
                    
                    // For now, let's skip FFmpeg conversion and send the original file
                    // This will work for most static stickers
                    let webpBuffer;
                    
                    if (isAnimated) {
                        // For animated stickers, try to use the original file
                        webpBuffer = imageBuffer;
                    } else {
                        // For static stickers, we can use the original file directly
                        webpBuffer = imageBuffer;
                    }

                    // Send sticker
                    await conn.sendMessage(m.chat, { 
                        sticker: webpBuffer 
                    });

                    successCount++;
                    await delay(1000); // Reduced delay

                    // Cleanup temp files
                    try {
                        if (fs.existsSync(tempInput)) {
                            fs.unlinkSync(tempInput);
                        }
                        if (fs.existsSync(tempOutput)) {
                            fs.unlinkSync(tempOutput);
                        }
                    } catch (err) {
                        console.error('Error cleaning up temp files:', err);
                    }

                } catch (err) {
                    console.error(`Error processing sticker ${i}:`, err);
                    continue;
                }
            }

            // Only send completion message at the end
            await reply(`✅ Successfully downloaded ${successCount}/${stickerSet.result.stickers.length} stickers!`);

        } catch (error) {
            throw new Error(`Failed to process sticker pack: ${error.message}`);
        }

    } catch (error) {
        console.error('Error in tg command:', error);
        return reply('❌ Failed to process Telegram stickers!\nMake sure:\n1. The URL is correct\n2. The sticker pack exists\n3. The sticker pack is public');
    }
};

trashplug.help = ['tg', 'telegram']
trashplug.tags = ['media']
trashplug.command = ['tg', 'telegram']

module.exports = trashplug;
