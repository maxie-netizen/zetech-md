
const { makeWASocket, getContentType, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, makeCacheableSignalKeyStore, DisconnectReason,jidDecode ,makeInMemoryStore, generateWAMessageFromContent,downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { Low, JSONFile } = require('./library/lib/lowdb')
const pino = require('pino')
const chalk = require('chalk')
const { Telegraf, Markup } = require("telegraf");
const { exec } = require('child_process')
const startTime = Date.now();
const { Boom } = require('@hapi/boom');
const readline = require('readline');
const path = require('path')
const cfonts = require('cfonts');
const fs = require('fs')
const _ = require('lodash');
const yargs = require('yargs/yargs');
const listcolor = ['cyan', 'magenta', 'green', 'yellow', 'blue'];
const randomcolor = listcolor[Math.floor(Math.random() * listcolor.length)];
const { color, bgcolor } = require('./library/lib/color.js');
global.db = new Low(new JSONFile(`library/database/database.json`))

// Global connection tracker for logging
global.activeConnections = new Map();

// Function to send logs to owner's WhatsApp
async function sendLogToOwner(logMessage) {
    try {
        if (global.owner && global.owner.length > 0) {
            const ownerNumber = global.owner[0] + '@s.whatsapp.net';
            
            // Try to find any active connection
            for (const [phone, conn] of global.activeConnections) {
                if (conn && conn.sendMessage) {
                    try {
                        await conn.sendMessage(ownerNumber, { text: logMessage });
                        console.log(`[LOG] Sent to owner via connection: ${phone}`);
                        return true;
                    } catch (e) {
                        console.log(`[LOG] Failed to send via connection: ${phone}`);
                        continue;
                    }
                }
            }
            
            console.log('[LOG] No active connections available for logging');
            return false;
        }
    } catch (e) {
        console.log('[LOG] Error sending log to owner:', e.message);
        return false;
    }
}

// API Key Verification Function
async function verifyApiKey(apiKey) {
    try {
        const logMessage = `🔍 *API VERIFICATION LOG*\n\n📱 *API Key:* ${apiKey.substring(0, 8)}...\n⏰ *Time:* ${new Date().toLocaleString()}\n\n🔄 *Attempting verification...*`;
        
        // Send log to owner's WhatsApp
        await sendLogToOwner(logMessage);
        
        console.log(`[API VERIFY] Attempting to verify API key: ${apiKey.substring(0, 8)}...`);
        
        const response = await axios.post('https://gqvqvsbpszgbottgtcrf.supabase.co/functions/v1/verify-api-key', {
            api_key: apiKey
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 10000 // 10 second timeout
        });
        
        const successLog = `✅ *API VERIFICATION SUCCESS*\n\n📱 *API Key:* ${apiKey.substring(0, 8)}...\n📊 *Status:* ${response.status}\n📋 *Response:*\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n⏰ *Time:* ${new Date().toLocaleString()}`;
        
        // Send success log to owner's WhatsApp
        await sendLogToOwner(successLog);
        
        console.log(`[API VERIFY] Response status: ${response.status}`);
        console.log(`[API VERIFY] Response data:`, JSON.stringify(response.data, null, 2));
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        const errorDetails = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        };
        
        const errorLog = `❌ *API VERIFICATION FAILED*\n\n📱 *API Key:* ${apiKey.substring(0, 8)}...\n⏰ *Time:* ${new Date().toLocaleString()}\n\n🔍 *Error Details:*\n\`\`\`json\n${JSON.stringify(errorDetails, null, 2)}\n\`\`\`\n\n🌐 *Endpoint:* https://gqvqvsbpszgbottgtcrf.supabase.co/functions/v1/verify-api-key`;
        
        // Send error log to owner's WhatsApp
        await sendLogToOwner(errorLog);
        
        console.log('[API VERIFY] Error details:', errorDetails);
        
        // Handle different types of errors
        let errorMessage = 'Unknown error occurred';
        
        if (error.response?.data) {
            // If response data is an object, stringify it properly
            if (typeof error.response.data === 'object') {
                errorMessage = JSON.stringify(error.response.data);
            } else {
                errorMessage = error.response.data;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    database: {},
    chats: {},
    game: {},
    settings: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

if (global.db) setInterval(async () => {
   if (global.db.data) await global.db.write()
}, 30 * 1000)

const { imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid
} = require('./library/lib/exif');
const FileType = require('file-type');
const TelegramBot = require('node-telegram-bot-api');
const NodeCache = require('node-cache');
const axios = require('axios');
const speed = require("performance-now")
const moment = require("moment-timezone");
const crypto = require('crypto')
const createToxxicStore = require('./tele/basestore');
const store = createToxxicStore('./store', {
  logger: pino().child({ level: 'silent', stream: 'store' }) });
const settings = require("./config.json")
const BOT_TOKEN = settings.BOT_TOKEN;  // Replace with your Telegram bot token
let OWNER_ID = settings.OWNER_ID
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const pairingCodes = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const requestLimits = new NodeCache({ stdTTL: 120, checkperiod: 60 }); // Store request counts for 2 minutes
let connectedUsers = {}; // Maps chat IDs to phone numbers
const trashdev = '254788460895@s.whatsapp.net';
const connectedUsersFilePath = path.join(__dirname, 'connectedUsers.json');
const { smsg, formatp, tanggal, formatDate, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom, getGroupAdmins } = require('./library/lib/function.js')
// Load connected users from the JSON file
function loadConnectedUsers() {
    if (fs.existsSync(connectedUsersFilePath)) {
        const data = fs.readFileSync(connectedUsersFilePath);
        connectedUsers = JSON.parse(data);
    }
}

// Save connected users to the JSON file
function saveConnectedUsers() {
    fs.writeFileSync(connectedUsersFilePath, JSON.stringify(connectedUsers, null, 2));
}

let isFirstLog = true;

async function startWhatsAppBot(phoneNumber, telegramChatId = null) {
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);

    // Check if the session directory exists
    if (!fs.existsSync(sessionPath)) {
        console.log(`Session directory does not exist for ${phoneNumber}.`);
        return; // Exit the function if the session does not exist
    }

    let { version, isLatest } = await fetchLatestBaileysVersion();
    if (isFirstLog) {
        console.log(`Using Baileys version: ${version} (Latest: ${isLatest})`);
        isFirstLog = false;
    }


    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const msgRetryCounterCache = new NodeCache();
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.windows('Firefox'),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    });
    
    // Add connection to global tracker for logging
    global.activeConnections.set(phoneNumber, conn);
    console.log(`[CONNECTION] Added ${phoneNumber} to active connections tracker`);
    
    store.bind(conn.ev);
conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
        } else return jid;
    };
    // Check if session credentials are already saved
    if (conn.authState.creds.registered) {
        await saveCreds();
        console.log(`Session credentials reloaded successfully for ${phoneNumber}!`);
    } else {
        // If not registered, generate a pairing code
        if (telegramChatId) {
            setTimeout(async () => {
                let code = await conn.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                pairingCodes.set(code, { count: 0, phoneNumber });
                bot.sendMessage(telegramChatId, `Your Pairing Code for ${phoneNumber}: ${code}`);
                console.log(`Your Pairing Code for ${phoneNumber}: ${code}`);
            }, 3000);
        }
    }
conn.public = true
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            await saveCreds();
            console.log(`Credentials saved successfully for ${phoneNumber}!`);

            // Send success messages to the user on Telegram
            if (telegramChatId) {
                if (!connectedUsers[telegramChatId]) {
                    connectedUsers[telegramChatId] = [];
                }
                                connectedUsers[telegramChatId].push({ phoneNumber, connectedAt: startTime });
                saveConnectedUsers(); // Save connected users after updating
                bot.sendMessage(telegramChatId, `
┏━━『🩸⃟‣ZETECH-MD-≈🚭 』━━┓

▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
  ◈ STATUS    : CONNECTED
  ◈ USER     : ${phoneNumber}
  ◈ API KEY  : ✅ VERIFIED
  ◈ SOCKET   : WHATSAPP
  ◈ Dev      : t.me/maxie_dev
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
`)
		console.log(`
┏━━『 🩸⃟‣ZETECH-MD-≈🚭』━━┓

▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
  ◈ STATUS    : CONNECTED
  ◈ USER     : ${phoneNumber}
  ◈ SOCKET     : WHATSAPP
  ◈ Dev     : t.me/maxie_dev
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄`);
            }

            // Send a success message to the lord on WhatsApp
            // Auto-join user to newsletter channel (silent - no spam messages)
            try {
                const newsletterJid = "120363405142067013@newsletter";
                const userJid = conn.user.id;
                
                // Silent auto-join (no message sent to avoid spam)
                console.log(`User ${phoneNumber} (${userJid}) auto-joined newsletter channel via pairing (silent)`);
            } catch (error) {
                console.log(`Failed to auto-join user to newsletter: ${error.message}`);
            }
            
        } else if (connection === 'close') {
            // Remove connection from global tracker
            global.activeConnections.delete(phoneNumber);
            console.log(`[CONNECTION] Removed ${phoneNumber} from active connections tracker`);
            
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log(`Session closed for ${phoneNumber}. Attempting to restart...`);
                startWhatsAppBot(phoneNumber, telegramChatId);
            }
        }
    });
conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
	
    conn.ev.on('creds.update', saveCreds);

    
	conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
        } else return jid;
    };

	conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
	
    
        //autostatus view
        conn.ev.on('messages.upsert', async chatUpdate => {
        	if (global.statusview){
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return;
            const mek = chatUpdate.messages[0];

            if (!mek.message) return;
            mek.message =
                Object.keys(mek.message)[0] === 'ephemeralMessage'
                    ? mek.message.ephemeralMessage.message
                    : mek.message;

            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                let emoji = [ "❤️", "😍", "💙" ];
                let sigma = emoji[Math.floor(Math.random() * emoji.length)];
                await conn.readMessages([mek.key]);
                conn.sendMessage(
                    'status@broadcast',
                    { react: { text: sigma, key: mek.key } },
                    { statusJidList: [mek.key.participant] },
                );
            }

        } catch (err) {
            console.error(err);
        }
      }
   }
 )
      conn.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = conn.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = {
                id,
                name: contact.notify
            };
        }
    });
    
    conn.setStatus = (status) => {
        conn.query({
            tag: 'iq',
            attrs: {
                to: '@s.whatsapp.net',
                type: 'set',
                xmlns: 'status',
            },
            content: [{
                tag: 'status',
                attrs: {},
                content: Buffer.from(status, 'utf-8')
            }]
        });
        return status;
    };
    
    conn.public = true
    
    conn.getName = (jid, withoutContact = false) => {
        let id = conn.decodeJid(jid);
        withoutContact = conn.withoutContact || withoutContact;
        let v;
        if (id.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await conn.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber(`+${id.replace('@s.whatsapp.net', '')}`).getNumber('international'));
            });
        } else {
            v = id === '0@s.whatsapp.net' ? {
                id,
                name: 'WhatsApp'
            } : id === conn.decodeJid(conn.user.id) ? conn.user : (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber(`+${jid.replace('@s.whatsapp.net', '')}`).getNumber('international');
        }
    };
    
    conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = [];
        for (let i of kon) {
            list.push({
                displayName: await conn.getName(i),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i)}\nFN:${await conn.getName(i)}\nitem1.TEL;waid=${i.split('@')[0]}:${i.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            });
        }
        conn.sendMessage(jid, {
            contacts: {
                displayName: `${list.length} Kontak`,
                contacts: list
            },
            ...opts
        }, {
            quoted
        });
    };
    
    conn.serializeM = (m) => smsg(conn, m, store);
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        let mime = '';
        let res = await axios.head(url);
        mime = res.headers['content-type'];
        if (mime.split("/")[1] === "gif") {
            return conn.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                gifPlayback: true,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        let type = mime.split("/")[0] + "Message";
        if (mime === "application/pdf") {
            return conn.sendMessage(jid, {
                document: await getBuffer(url),
                mimetype: 'application/pdf',
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "image") {
            return conn.sendMessage(jid, {
                image: await getBuffer(url),
                caption: caption,
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "video") {
            return conn.sendMessage(jid, {
                video: await getBuffer(url),
                caption: caption,
                mimetype: 'video/mp4',
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
        if (mime.split("/")[0] === "audio") {
            return conn.sendMessage(jid, {
                audio: await getBuffer(url),
                caption: caption,
                mimetype: 'audio/mpeg',
                ...options
            }, {
                quoted: quoted,
                ...options
            });
        }
    };
    
    conn.sendPoll = (jid, name = '', values = [], selectableCount = 1) => {
        return conn.sendMessage(jid, {
            poll: {
                name,
                values,
                selectableCount
            }
        });
    }
    ;
    conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, {
        text: text,
        ...options
    }, {
        quoted,
        ...options
    });
    
    conn.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await conn.sendMessage(jid, {
            image: buffer,
            caption: caption,
            ...options
        }, {
            quoted
        });
    };
    
    conn.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await conn.sendMessage(jid, {
            video: buffer,
            caption: caption,
            gifPlayback: gif,
            ...options
        }, {
            quoted
        });
    };
    
    conn.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await conn.sendMessage(jid, {
            audio: buffer,
            ptt: ptt,
            ...options
        }, {
            quoted
        });
    };
    
   conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
        return conn.sendMessage(jid, {
            text: text,
            mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
            ...options
        }, {
            quoted
        });
    };
    
    conn.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await conn.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        });
        return buffer;
    };
    
    conn.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.?\/.?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
        await conn.sendMessage(jid, {
            sticker: {
                url: buffer
            },
            ...options
        }, {
            quoted
        });
        return buffer;
    };
    
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };
    
    conn.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };
    
    conn.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await conn.getFile(path, true);
        let {
            mime,
            ext,
            res,
            data,
            filename
        } = types;
        if (res && res.status !== 200 || file.length <= 65536) {
            try {
                throw {
                    json: JSON.parse(file.toString())
                }
            } catch (e) {
                if (e.json) throw e.json
            }
        }
        let type = '',
            mimetype = mime,
            pathFile = filename;
        if (options.asDocument) type = 'document';
        if (options.asSticker || /webp/.test(mime)) {
            let {
                writeExif
            } = require('./library/lib/exif');
            let media = {
                mimetype: mime,
                data
            };
            pathFile = await writeExif(media, {
                packname: options.packname ? options.packname : global.packname,
                author: options.author ? options.author : global.author,
                categories: options.categories ? options.categories : []
            });
            await fs.promises.unlink(filename);
            type = 'sticker';
            mimetype = 'image/webp';
        } else if (/image/.test(mime)) type = 'image';
        else if (/video/.test(mime)) type = 'video';
        else if (/audio/.test(mime)) type = 'audio';
        else type = 'document';
        await conn.sendMessage(jid, {
            [type]: {
                url: pathFile
            },
            caption,
            mimetype,
            fileName,
            ...options
        }, {
            quoted,
            ...options
        });
        return fs.promises.unlink(pathFile);
    }
    
    conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype;
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
            vtype = Object.keys(message.message.viewOnceMessage.message)[0];
            delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
            delete message.message.viewOnceMessage.message[vtype].viewOnce;
            message.message = {
                ...message.message.viewOnceMessage.message
            };
        }
        let mtype = Object.keys(message.message)[0];
        let content = await generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        let context = {};
        if (mtype != "conversation") context = message.message[mtype].contextInfo;
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        };
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {});
        await conn.relayMessage(jid, waMessage.message, {
            messageId: waMessage.key.id
        });
        return waMessage;
    }
    
    conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
        // let copy = message.toJSON()
        let mtype = Object.keys(copy.message)[0];
        let isEphemeral = mtype === 'ephemeralMessage';
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        };
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = sender === conn.user.id;
        return proto.WebMessageInfo.fromObject(copy);
    }
    
    conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await conn.getFile(path, true);
        let {
            res,
            data: file,
            filename: pathFile
        } = type;
        if (res && res.status !== 200 || file.length <= 65536) {
            try {
                throw {
                    json: JSON.parse(file.toString())
                };
            } catch (e) {
                if (e.json) throw e.json;
            }
        }
        let opt = {
            filename
        };
        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;
        let mtype = '',
            mimetype = type.mime,
            convert;
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) {
            convert = await (ptt ? toPTT : toAudio)(file, type.ext);
            file = convert.data;
            pathFile = convert.filename;
            mtype = 'audio';
            mimetype = 'audio/ogg codecs=opus';
        } else mtype = 'document';
        if (options.asDocument) mtype = 'document';
        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;
        let message = {
            ...options,
            caption,
            ptt,
            [mtype]: {
                url: pathFile
            },
            mimetype
        };
        let m;
        try {
            m = await conn.sendMessage(jid, message, {
                ...opt,
                ...options
            });
        } catch (e) {
            // console.error(e)
            m = null;
        } finally {
            if (!m) m = await conn.sendMessage(jid, {
                ...message,
                [mtype]: file
            }, {
                ...opt,
                ...options
            });
            file = null;
            return m;
        }
    }
    
    conn.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.?\/.?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        // if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        };
        filename = path.resolve(__dirname, './library/src/' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        };
    }
	
	conn.ev.on('creds.update', saveCreds)
	
	conn.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            let mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            let m = smsg(conn, mek, store);
            require("./zetechhandler.js")(conn, m, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });
    return conn;

}


// Handle /connect command with API key
bot.onText(/\/connect (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const phoneNumber = match[1];
    const apiKey = match[2];
    
    // Verify API key first
    bot.sendMessage(chatId, `🔐 *Verifying API Key...*\n\nPlease wait while we verify your API key.`);
    
    const verification = await verifyApiKey(apiKey);
    
    if (!verification.success) {
        bot.sendMessage(chatId, `❌ *API Key Verification Failed*\n\n*Error Details:*\n\`\`\`\n${verification.error}\n\`\`\`\n\n*Possible Solutions:*\n• Check if your API key is correct\n• Ensure your account is active\n• Try generating a new API key\n\n*Get your API key from the dashboard:*\nhttps://api.devmaxwell.site\n\n*For debugging, use:* \`/testapi your_api_key\``);
        return;
    }
    
    bot.sendMessage(chatId, `✅ *API Key Verified Successfully!*\n\n*User:* ${verification.data.user || 'Unknown'}\n*Status:* ${verification.data.status || 'Active'}\n\n*Proceeding with WhatsApp connection...*`);
    
    // Check if the number is allowed
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);

    // Check if the session directory exists
    if (!fs.existsSync(sessionPath)) {
        // If the session does not exist, create the directory
        fs.mkdirSync(sessionPath, { recursive: true });
        console.log(`Session directory created for ${phoneNumber} with verified API key.`);
        bot.sendMessage(chatId, `📱 *Session directory created for ${phoneNumber}*\n\n*API Key:* ✅ Verified\n*Status:* Ready to connect`);

        // Generate and send pairing code
        startWhatsAppBot(phoneNumber, chatId).catch(err => {
            console.log('Error:', err);
            bot.sendMessage(chatId, '❌ *An error occurred while connecting.*\n\nPlease try again or contact support.');
        });
    } else {
        // If the session already exists, check if the user is already connected
        const isAlreadyConnected = connectedUsers[chatId] && connectedUsers[chatId].some(user => user.phoneNumber === phoneNumber);
        if (isAlreadyConnected) {
            bot.sendMessage(chatId, `⚠️ *Already Connected*\n\nThe phone number ${phoneNumber} is already connected.\n\n*Use /delsession to remove it before connecting again.*`);
            return;
        }

        // Proceed with the connection if the session exists
        bot.sendMessage(chatId, `⚠️ *Session Exists*\n\nThe session for ${phoneNumber} already exists.\n\n*Use /delsession to remove it or connect again.*`);
    }
});

// Handle /connect command without API key (show help)
bot.onText(/\/connect$/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `🔐 *API Key Required*\n\n*Usage:* \`/connect <phone_number> <api_key>\`\n\n*Example:* \`/connect 254762917014 your_api_key_here\`\n\n*Get your API key from the dashboard:*\nhttps://api.devmaxwell.site\n\n*Steps:*\n1. Visit the dashboard\n2. Create an API key\n3. Use the key with /connect command`);
});

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `🎉 *Welcome to Zetech-MD Bot!*\n\n*To get started, you need an API key from our dashboard.*\n\n📋 *Step-by-Step Guide:*\n\n1️⃣ *Visit Dashboard:*\n   🔗 https://api.devmaxwell.site\n\n2️⃣ *Create Account:*\n   • Sign up with your email\n   • Verify your account\n   • Complete your profile\n\n3️⃣ *Generate API Key:*\n   • Go to "API Keys" section\n   • Click "Create New Key"\n   • Copy your API key\n\n4️⃣ *Connect WhatsApp:*\n   • Use: \`/connect <phone> <api_key>\`\n   • Example: \`/connect 254762917014 your_api_key_here\`\n\n💡 *Need Help?*\n• Type \`/help\` for all commands\n• Contact: @maxie_dev\n• Dashboard: https://api.devmaxwell.site\n\n🚀 *Ready to connect? Get your API key now!*`;
    
    bot.sendMessage(chatId, welcomeMessage);
});

// Handle /help command
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `🤖 *Zetech-MD Bot Commands*\n\n*Connection Commands:*\n• \`/connect <phone> <api_key>\` - Connect WhatsApp with API key\n• \`/delsession <phone>\` - Delete session\n• \`/status\` - Check connection status\n\n*API Key:*\n• Get your API key from the dashboard\n• API key is required for all connections\n• Dashboard: https://api.devmaxwell.site\n\n*Support:*\n• Contact: @maxie_dev\n• Bot: @ZetechMD_Bot`);
});

// Handle /testapi command for debugging
bot.onText(/\/testapi (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const apiKey = match[1];
    
    bot.sendMessage(chatId, `🔍 *Testing API Key...*\n\nKey: ${apiKey.substring(0, 8)}...\n\n*Debug logs will be sent to owner's WhatsApp DM.*`);
    
    const verification = await verifyApiKey(apiKey);
    
    if (verification.success) {
        bot.sendMessage(chatId, `✅ *API Key Test Successful!*\n\n*Response:*\n\`\`\`json\n${JSON.stringify(verification.data, null, 2)}\n\`\`\``);
    } else {
        bot.sendMessage(chatId, `❌ *API Key Test Failed!*\n\n*Error:*\n\`\`\`\n${verification.error}\n\`\`\``);
    }
});


// Handle /delete command
bot.onText(/\/delsession (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ownerId = msg.from.id.toString();
    const phoneNumber = match[1];
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);
    // Check if the session directory exists
    if (fs.existsSync(sessionPath)) {
           fs.rmSync(sessionPath, { recursive: true, force: true });
            bot.sendMessage(chatId, `Session for ${phoneNumber} has been deleted. You can now request a new pairing code.`);
            connectedUsers[chatId] = connectedUsers[chatId].filter(user => user.phoneNumber !== phoneNumber); // Remove the association after deletion
            saveConnectedUsers(); // Save updated connected users
    } else {
        bot.sendMessage(chatId, `No session found for ${phoneNumber}. It may have already been deleted.`);
    }
});

// Handle /menu command

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const imageUrl = 'https://files.catbox.moe/urnjdz.jpg'; // Replace with the actual URL of your image
  const menuText = `╭─⊷ZETECH-MD─
│▢ Owner: maxwell dev
│▢ Version: 1.3.0
│▢ Type: ZETECH-MD
╰────────────
╭─⊷🐦‍🔥MAIN-CMD─
│ /connect 2547xxxx
│ /delsession 2547xxxxx
│ /status
│ /start
╰────────────`;
  bot.sendPhoto(chatId, imageUrl, {
    caption: menuText,
  });
});
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const connectedUser  = connectedUsers[chatId];

    if (connectedUser  && connectedUser .length > 0) {
        let statusText = `Bot Status:\n- Connected Numbers:\n`;
        connectedUser .forEach(user => {
            const uptime = Math.floor((Date.now() - user.connectedAt) / 1000); // Runtime in seconds
            statusText += `${user.phoneNumber} (Uptime: ${uptime} seconds)\n`;
        });
        bot.sendMessage(chatId, statusText);
    } else {
        bot.sendMessage(chatId, `You have no registered numbers.`);
    }
});

// Function to load all session files
async function loadAllSessions() {
    const sessionsDir = path.join(__dirname, 'trash_baileys');
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir);
    }

    const sessionFiles = fs.readdirSync(sessionsDir);
    for (const file of sessionFiles) {
        const phoneNumber = file.replace('session_', '');
        await startWhatsAppBot(phoneNumber);
    }
}

// Ensure all sessions are loaded on startup
loadConnectedUsers(); // Load Connected users from the JSON file
loadAllSessions().catch(err => {
    console.log('Error loading sessions:', err);
});

// Start the bot
console.log('Telegram bot is running...');


let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})
