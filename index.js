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

// Cloud Storage Integration
const CloudStorageManager = require('./library/lib/cloudStorageManager');
const { getCurrentProvider } = require('./cloudConfig');

// Log Collector Integration
const LogCollector = require('./library/lib/logCollector');

// Initialize cloud storage
global.cloudStorage = new CloudStorageManager();
global.autoSync = null;
global.cloudInitialized = false;

// Initialize log collector
global.logCollector = new LogCollector();

global.db = new Low(new JSONFile(`library/database/database.json`))

// Global connection tracker for logging
global.activeConnections = new Map();
global.connectionAttempts = new Map(); // Track connection attempts to prevent spam

// Initialize cloud storage and load data
async function initializeCloudStorage() {
    try {
        console.log('🔄 Initializing cloud storage...');
        
        // Initialize cloud storage system
        const connected = await global.cloudStorage.initialize();
        if (!connected) {
            console.log('❌ Failed to initialize cloud storage system');
            return false;
        }
        
        const provider = getCurrentProvider();
        console.log(`✅ ${provider.name} ready`);
        
        // Load database from backup
        console.log('📥 Loading database from backup...');
        const dbLoaded = await global.cloudStorage.loadDatabase();
        if (dbLoaded) {
            console.log('✅ Database loaded from backup');
        }
        
        global.cloudInitialized = true;
        console.log('🎉 Cloud storage system ready!');
        return true;
        
    } catch (error) {
        console.error('❌ Cloud storage initialization failed:', error.message);
        return false;
    }
}

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

// Function to check if API key has already been used
async function isApiKeyUsed(apiKey) {
    await global.loadDatabase();
    const usedKeys = global.db.data.usedApiKeys || {};
    return usedKeys[apiKey] !== undefined;
}

// Function to mark API key as used
async function markApiKeyAsUsed(apiKey, phoneNumber, telegramChatId) {
    await global.loadDatabase();
    if (!global.db.data.usedApiKeys) {
        global.db.data.usedApiKeys = {};
    }
    
    global.db.data.usedApiKeys[apiKey] = {
        phoneNumber: phoneNumber,
        telegramChatId: telegramChatId,
        usedAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    await global.db.write();
    console.log(`[API KEY] Marked API key ${apiKey.substring(0, 8)}... as used for phone number ${phoneNumber}`);
}

// API Key Verification Function
async function verifyApiKey(apiKey) {
    try {
        const logMessage = `🔍 API VERIFICATION LOG\n\n📱 API Key: ${apiKey.substring(0, 8)}...\n⏰ Time: ${new Date().toLocaleString()}\n\n🔄 Attempting verification...`;
        
        // Send log to owner's WhatsApp
        await sendLogToOwner(logMessage);
        
        console.log(`[API VERIFY] Attempting to verify API key: ${apiKey.substring(0, 8)}...`);
        
        const response = await axios.post('https://gqvqvsbpszgbottgtcrf.supabase.co/functions/v1/verify-api-key', {
            api_key: apiKey
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            timeout: 10000 // 10 second timeout
        });
        
        const successLog = `✅ API VERIFICATION SUCCESS\n\n📱 API Key: ${apiKey.substring(0, 8)}...\n📊 Status: ${response.status}\n📋 Response:\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n⏰ Time: ${new Date().toLocaleString()}`;
        
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
        
        const errorLog = `❌ API VERIFICATION FAILED\n\n📱 API Key: ${apiKey.substring(0, 8)}...\n⏰ Time: ${new Date().toLocaleString()}\n\n🔍 Error Details:\n\`\`\`json\n${JSON.stringify(errorDetails, null, 2)}\n\`\`\`\n\n🌐 Endpoint: https://gqvqvsbpszgbottgtcrf.supabase.co/functions/v1/verify-api-key`;
        
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

// Function to check if API key is expired
async function isApiKeyExpired(apiKey) {
    try {
        const response = await axios.post('https://gqvqvsbpszgbottgtcrf.supabase.co/functions/v1/verify-api-key', {
            api_key: apiKey
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            timeout: 10000
        });
        
        // If we get a successful response, the key is still valid
        return false;
    } catch (error) {
        // Check if the error indicates expiration
        if (error.response?.status === 401 || error.response?.status === 403) {
            return true; // Key is expired or invalid
        }
        return false; // Other errors, assume key is still valid
    }
}

// Function to disconnect a session
async function disconnectSession(phoneNumber, telegramChatId, reason = 'API key expired') {
    try {
        // Close the WhatsApp connection
        const connection = global.activeConnections.get(phoneNumber);
        if (connection) {
            await connection.logout();
            global.activeConnections.delete(phoneNumber);
            console.log(`[DISCONNECT] Disconnected ${phoneNumber} - ${reason}`);
        }
        
        // Remove from connected users
        if (connectedUsers[telegramChatId]) {
            connectedUsers[telegramChatId] = connectedUsers[telegramChatId].filter(user => user.phoneNumber !== phoneNumber);
            saveConnectedUsers();
        }
        
        // Send notification to user
        if (telegramChatId) {
            safeSendMessage(telegramChatId, `🔒 Session Disconnected\n\n📱 Phone: ${phoneNumber}\n📋 Reason: ${reason}\n\n💡 Please generate a new API key and reconnect using /connect command.\n\n🌐 Dashboard: https://api.devmaxwell.site`);
        }
        
        // Log to owner
        const logMessage = `🔒 SESSION DISCONNECTED\n\n📱 Phone: ${phoneNumber}\n📋 Reason: ${reason}\n⏰ Time: ${new Date().toLocaleString()}`;
        await sendLogToOwner(logMessage);
        
        return true;
    } catch (error) {
        console.log(`[DISCONNECT] Error disconnecting ${phoneNumber}:`, error.message);
        return false;
    }
}

// Function to check all active sessions for API key expiration
async function checkAllSessionsForExpiration() {
    try {
        await global.loadDatabase();
        const usedKeys = global.db.data.usedApiKeys || {};
        
        console.log(`[EXPIRY CHECK] Checking ${Object.keys(usedKeys).length} API keys for expiration...`);
        
        for (const [apiKey, keyData] of Object.entries(usedKeys)) {
            const { phoneNumber, telegramChatId } = keyData;
            
            // Check if this phone number is currently connected
            const isConnected = global.activeConnections.has(phoneNumber);
            
            if (isConnected) {
                console.log(`[EXPIRY CHECK] Checking API key for ${phoneNumber}...`);
                
                const isExpired = await isApiKeyExpired(apiKey);
                
                if (isExpired) {
                    console.log(`[EXPIRY CHECK] API key expired for ${phoneNumber}, disconnecting...`);
                    await disconnectSession(phoneNumber, telegramChatId, 'API key expired');
                    
                    // Mark the key as expired in database
                    global.db.data.usedApiKeys[apiKey].expired = true;
                    global.db.data.usedApiKeys[apiKey].expiredAt = new Date().toISOString();
                    await global.db.write();
                } else {
                    console.log(`[EXPIRY CHECK] API key still valid for ${phoneNumber}`);
                }
            }
        }
        
        console.log(`[EXPIRY CHECK] Expiration check completed`);
    } catch (error) {
        console.log(`[EXPIRY CHECK] Error during expiration check:`, error.message);
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

// Global bot instance management to prevent multiple instances
let bot = null;
let botInitialized = false;
let botStopped = false;

// Process lock to prevent multiple instances
const lockFile = path.join(__dirname, '.bot.lock');
let lockFileHandle = null;

// Function to check if a process is actually running
function isProcessRunning(pid) {
    try {
        // On Windows, use tasklist to check if process exists
        const { execSync } = require('child_process');
        const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV`, { encoding: 'utf8' });
        return result.includes(pid.toString());
    } catch (error) {
        // If command fails, assume process is not running
        return false;
    }
}

// Function to create process lock with smart handling
async function createProcessLock() {
    try {
        if (fs.existsSync(lockFile)) {
            const lockData = fs.readFileSync(lockFile, 'utf8');
            const lockInfo = JSON.parse(lockData);
            const now = Date.now();
            
            // Check if lock is stale (older than 5 minutes)
            if (now - lockInfo.timestamp > 5 * 60 * 1000) {
                console.log('🔄 Removing stale lock file');
                fs.unlinkSync(lockFile);
            } else {
                // Check if the process is actually still running
                const isRunning = isProcessRunning(lockInfo.pid);
                
                if (!isRunning) {
                    console.log('🔄 Previous process is no longer running, removing stale lock');
                    fs.unlinkSync(lockFile);
                } else {
                    console.log('⚠️ Another bot instance is running');
                    console.log(`Lock created at: ${new Date(lockInfo.timestamp).toLocaleString()}`);
                    console.log(`Process ID: ${lockInfo.pid}`);
                    console.log('🔄 Options:');
                    console.log('   1. Wait for previous instance to finish (recommended)');
                    console.log('   2. Force stop previous instance');
                    console.log('   3. Exit and try again later');
                    console.log('');
                    console.log('🔄 Waiting for previous instance to finish...');
                    
                    // Wait for the lock file to be removed (up to 30 seconds)
                    let attempts = 0;
                    const maxAttempts = 30; // 30 seconds
                    
                    while (fs.existsSync(lockFile) && attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        attempts++;
                        
                        // Check if the process is still running
                        if (!isProcessRunning(lockInfo.pid)) {
                            console.log('🔄 Previous process finished, removing lock');
                            fs.unlinkSync(lockFile);
                            break;
                        }
                        
                        if (attempts % 5 === 0) {
                            console.log(`⏳ Still waiting... (${attempts}/${maxAttempts} seconds)`);
                        }
                    }
                    
                    // If still locked after waiting, force stop the previous instance
                    if (fs.existsSync(lockFile)) {
                        console.log('⚠️ Previous instance is still running after 30 seconds');
                        console.log('🔄 Force stopping previous instance...');
                        
                        try {
                            // Force kill the previous process
                            const { execSync } = require('child_process');
                            execSync(`taskkill /PID ${lockInfo.pid} /F`, { stdio: 'ignore' });
                            console.log('✅ Previous instance force stopped');
                            
                            // Wait a moment for cleanup
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            // Remove lock file
                            if (fs.existsSync(lockFile)) {
                                fs.unlinkSync(lockFile);
                            }
                            
                        } catch (killError) {
                            console.log('⚠️ Could not force stop previous instance');
                            console.log('🔄 Forcing removal of lock file and continuing...');
                            console.log('💡 If you get conflicts, use: npm run cleanup');
                            fs.unlinkSync(lockFile);
                        }
                    }
                }
            }
        }
        
        // Create new lock file
        const lockData = {
            pid: process.pid,
            timestamp: Date.now(),
            startTime: new Date().toISOString()
        };
        
        fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
        console.log('🔒 Process lock created successfully');
        
        // Clean up lock file on exit
        process.on('exit', () => {
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to create process lock:', error.message);
        console.log('🔄 Continuing anyway...');
    }
}

// Function to initialize bot with proper error handling
function initializeBot() {
    if (botInitialized && bot && !botStopped) {
        console.log('Bot already initialized, reusing existing instance');
        return bot;
    }
    
    if (botStopped) {
        console.log('🔄 Previous bot was stopped due to conflict, initializing new instance...');
        botStopped = false;
    }
    
    try {
        bot = new TelegramBot(BOT_TOKEN, { 
            polling: true,
            request: {
                agentOptions: {
                    keepAlive: true,
                    family: 4
                }
            }
        });
        
        // Add error handlers
        bot.on('error', (error) => {
            console.error('❌ Bot error:', error.message);
        });
        
        bot.on('polling_error', (error) => {
            console.error('❌ Bot polling error:', error.message);
            
            // If it's a 409 conflict, stop polling to allow new instance
            if (error.message.includes('409 Conflict')) {
                console.log('🔄 Detected 409 conflict, stopping polling to allow new instance...');
                botStopped = true;
                if (bot && bot.stopPolling) {
                    bot.stopPolling();
                }
            }
        });
        
        botInitialized = true;
        console.log('✅ Telegram bot initialized successfully');
        return bot;
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
        throw error;
    }
}

// Initialize bot
bot = initializeBot();

// Add a simple test to verify bot is working
bot.on('message', (msg) => {
    console.log('📨 Message received:', msg.text || '[non-text message]', 'from:', msg.chat.id);
});

// Helper function to safely send messages
function safeSendMessage(chatId, message, options = {}) {
    if (!bot || !botInitialized) {
        console.log('⚠️ Bot not initialized, cannot send message');
        return Promise.resolve();
    }
    
    try {
        return bot.sendMessage(chatId, message, options);
    } catch (error) {
        console.error('❌ Error sending message:', error.message);
        return Promise.resolve();
    }
}
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

// Clean up duplicate entries in connectedUsers
function cleanupConnectedUsers() {
    for (const chatId in connectedUsers) {
        if (connectedUsers[chatId] && Array.isArray(connectedUsers[chatId])) {
            // Remove duplicates based on phone number
            const uniqueUsers = [];
            const seenPhoneNumbers = new Set();
            
            for (const user of connectedUsers[chatId]) {
                if (!seenPhoneNumbers.has(user.phoneNumber)) {
                    seenPhoneNumbers.add(user.phoneNumber);
                    uniqueUsers.push(user);
                }
            }
            
            connectedUsers[chatId] = uniqueUsers;
        }
    }
    saveConnectedUsers();
}

let isFirstLog = true;

async function startWhatsAppBot(phoneNumber, telegramChatId = null) {
    // Check if connection attempt is already in progress for this phone number
    if (global.connectionAttempts.has(phoneNumber)) {
        console.log(`[DUPLICATE] Connection attempt already in progress for ${phoneNumber}, skipping`);
        if (telegramChatId) {
            safeSendMessage(telegramChatId, `⚠️ Connection Already in Progress\n\nA connection attempt for ${phoneNumber} is already in progress. Please wait for it to complete.`);
        }
        return;
    }
    
    // Check for too many connection attempts
    if (!global.connectionAttemptCount) global.connectionAttemptCount = new Map();
    const attemptCount = global.connectionAttemptCount.get(phoneNumber) || 0;
    if (attemptCount > 5) {
        console.log(`[LIMIT] Too many connection attempts for ${phoneNumber}, stopping`);
        if (telegramChatId) {
            safeSendMessage(telegramChatId, `⚠️ Too Many Connection Attempts\n\nPhone: ${phoneNumber}\n\nPlease wait before trying again.`);
        }
        return;
    }
    global.connectionAttemptCount.set(phoneNumber, attemptCount + 1);
    
    // Mark connection attempt as in progress
    global.connectionAttempts.set(phoneNumber, { startTime: Date.now(), telegramChatId });
    
    // Set a timeout to clean up stuck connection attempts (5 minutes)
    setTimeout(() => {
        if (global.connectionAttempts.has(phoneNumber)) {
            console.log(`[TIMEOUT] Cleaning up stuck connection attempt for ${phoneNumber}`);
            global.connectionAttempts.delete(phoneNumber);
        }
    }, 5 * 60 * 1000); // 5 minutes timeout
    
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);

    // Check if the session directory exists locally
    if (!fs.existsSync(sessionPath)) {
        console.log(`Session directory does not exist locally for ${phoneNumber}.`);
        
        // Try to load session from cloud if cloud storage is initialized
        if (global.cloudInitialized && global.cloudStorage) {
            console.log(`🔄 Attempting to load session from cloud for ${phoneNumber}...`);
            const sessionLoaded = await global.cloudStorage.loadSession(phoneNumber);
            if (sessionLoaded) {
                console.log(`✅ Session loaded from cloud for ${phoneNumber}`);
            } else {
                console.log(`ℹ️ No session found in cloud for ${phoneNumber} - will create new session`);
                // Create session directory for new session
                fs.mkdirSync(sessionPath, { recursive: true });
            }
        } else {
            console.log(`ℹ️ Cloud storage not available - will create new session for ${phoneNumber}`);
            // Create session directory for new session
            fs.mkdirSync(sessionPath, { recursive: true });
        }
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
        defaultQueryTimeoutMs: 60000, // Increased timeout
        connectTimeoutMs: 60000, // Added connection timeout
        keepAliveIntervalMs: 10000, // Added keep alive
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
        // If not registered, generate a pairing code with error handling
        if (telegramChatId) {
            try {
                let code = await conn.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                pairingCodes.set(code, { count: 0, phoneNumber });
                safeSendMessage(telegramChatId, `📱 Your Pairing Code for ${phoneNumber}:\n\n🔑 ${code}\n\n💡 Use this code to connect your WhatsApp account.`);
                console.log(`Your Pairing Code for ${phoneNumber}: ${code}`);
            } catch (error) {
                console.error(`Error generating pairing code for ${phoneNumber}:`, error);
                if (telegramChatId) {
                    safeSendMessage(telegramChatId, `❌ Error generating pairing code for ${phoneNumber}:\n\n${error.message}\n\nPlease try again.`);
                }
                // Remove from active connections
                global.activeConnections.delete(phoneNumber);
                return;
            }
        }
    }
    
    conn.public = true
    
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            await saveCreds();
            console.log(`Credentials saved successfully for ${phoneNumber}!`);

            // Clean up connection attempt tracking
            global.connectionAttempts.delete(phoneNumber);

            // Send success messages to the user on Telegram
            if (telegramChatId) {
                if (!connectedUsers[telegramChatId]) {
                    connectedUsers[telegramChatId] = [];
                }
                
                // Check if this phone number is already connected to avoid duplicates
                const isAlreadyConnected = connectedUsers[telegramChatId].some(user => user.phoneNumber === phoneNumber);
                if (!isAlreadyConnected) {
                    connectedUsers[telegramChatId].push({ phoneNumber, connectedAt: startTime });
                    saveConnectedUsers(); // Save connected users after updating
                } else {
                    console.log(`[DUPLICATE] Phone number ${phoneNumber} is already connected, skipping duplicate connection`);
                    return; // Exit early to prevent spam
                }
				
                connectedUsers[telegramChatId].push({ phoneNumber, connectedAt: startTime });
                saveConnectedUsers(); // Save connected users after updating
                safeSendMessage(telegramChatId, `
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
            // Clean up connection attempt tracking
            global.connectionAttempts.delete(phoneNumber);
            console.log(`[CONNECTION] Removed ${phoneNumber} from active connections tracker`);
            
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log(`Session closed for ${phoneNumber}. Attempting to restart...`);
                // Add longer delay before restarting to prevent infinite loop
                setTimeout(() => {
                    startWhatsAppBot(phoneNumber, telegramChatId).catch(err => {
                        console.error(`Failed to restart session for ${phoneNumber}:`, err);
                    });
                }, 30000); // 30 second delay before restart
            } else {
                console.log(`Session for ${phoneNumber} was logged out. Not restarting.`);
                if (telegramChatId) {
                    safeSendMessage(telegramChatId, `🔒 Session Logged Out\n\n📱 Phone: ${phoneNumber}\n\n💡 Use /connect to reconnect.`);
                }
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
    
    // Check if API key has already been used
    const isUsed = await isApiKeyUsed(apiKey);
    if (isUsed) {
        await global.loadDatabase();
        const usedKeyData = global.db.data.usedApiKeys[apiKey];
        const usedTime = new Date(usedKeyData.usedAt).toLocaleString();
        
        safeSendMessage(chatId, `🔒 API Key Already Used\n\nThis API key has already been used and cannot be reused.\n\n📋 Used Details:\n• Phone Number: ${usedKeyData.phoneNumber}\n• Used At: ${usedTime}\n• Telegram Chat: ${usedKeyData.telegramChatId}\n\n💡 Solution:\n• Generate a new API key from the dashboard\n• Each API key can only be used once\n\n🌐 Dashboard: https://api.devmaxwell.site`);
        return;
    }
    
    // Verify API key first
    safeSendMessage(chatId, `🔐 Verifying API Key...\n\nPlease wait while we verify your API key.`);
    
    const verification = await verifyApiKey(apiKey);
    
    if (!verification.success) {
        safeSendMessage(chatId, `❌ API Key Verification Failed\n\n📋 Error Details:\n\`\`\`\n${verification.error}\n\`\`\`\n\n💡 Possible Solutions:\n• Check if your API key is correct\n• Ensure your account is active\n• Try generating a new API key\n\n🌐 Get your API key from the dashboard:\nhttps://api.devmaxwell.site\n\n🔧 For debugging, use: /testapi your_api_key`);
        return;
    }
    
    // Additional check: Verify API key is not expired
    const isExpired = await isApiKeyExpired(apiKey);
    if (isExpired) {
        safeSendMessage(chatId, `❌ API Key Expired\n\n🔒 Your API key has expired and is no longer valid.\n\n💡 Please generate a new API key from the dashboard and try again.\n\n🌐 Dashboard: https://api.devmaxwell.site`);
        return;
    }
    
    safeSendMessage(chatId, `✅ API Key Verified Successfully!\n\n👤 User: ${verification.data.user || 'Unknown'}\n📊 Status: ${verification.data.status || 'Active'}\n\n🔄 Proceeding with WhatsApp connection...`);
    
    // Check if the number is allowed
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);

    // Check if the session directory exists
    if (!fs.existsSync(sessionPath)) {
        // If the session does not exist, create the directory
        fs.mkdirSync(sessionPath, { recursive: true });
        console.log(`Session directory created for ${phoneNumber} with verified API key.`);
        
        // Mark API key as used
        await markApiKeyAsUsed(apiKey, phoneNumber, chatId);
        
        // Sync new session to cloud if cloud storage is available
        if (global.cloudInitialized && global.autoSync) {
            console.log(`🔄 Syncing new session to cloud: ${phoneNumber}`);
            try {
                await global.autoSync.syncSession(phoneNumber);
                console.log(`✅ Session synced to cloud: ${phoneNumber}`);
            } catch (error) {
                console.error(`❌ Failed to sync session to cloud: ${error.message}`);
            }
        }
        
        safeSendMessage(chatId, `📱 Session directory created for ${phoneNumber}\n\n🔑 API Key: ✅ Verified & Used\n📊 Status: Ready to connect\n\n⚠️ Note: This API key has been marked as used and cannot be reused.`);

        // Generate and send pairing code
        startWhatsAppBot(phoneNumber, chatId).catch(err => {
            console.log('Error:', err);
            safeSendMessage(chatId, '❌ An error occurred while connecting.\n\nPlease try again or contact support.');
        });
    } else {
        // If the session already exists, check if the user is already connected
        const isAlreadyConnected = connectedUsers[chatId] && connectedUsers[chatId].some(user => user.phoneNumber === phoneNumber);
        if (isAlreadyConnected) {
            safeSendMessage(chatId, `⚠️ Already Connected\n\nThe phone number ${phoneNumber} is already connected.\n\n💡 Use /delsession to remove it before connecting again.`);
            return;
        }

        // Proceed with the connection if the session exists
        safeSendMessage(chatId, `⚠️ Session Exists\n\nThe session for ${phoneNumber} already exists.\n\n💡 Use /delsession to remove it or connect again.`);
    }
});

// Handle /connect command without API key (show help)
bot.onText(/\/connect$/, async (msg) => {
    const chatId = msg.chat.id;
    safeSendMessage(chatId, `🔐 API Key Required\n\n📝 Usage: /connect <phone_number> <api_key>\n\n💡 Example: /connect 254762917014 your_api_key_here\n\n🌐 Get your API key from the dashboard:\nhttps://api.devmaxwell.site\n\n📋 Steps:\n1. Visit the dashboard\n2. Create an API key\n3. Use the key with /connect command`);
});

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    console.log('📱 /start command received from:', msg.chat.id);
    const chatId = msg.chat.id;
    const welcomeMessage = `🎉 Welcome to Zetech-MD Bot!\n\nTo get started, you need an API key from our dashboard.\n\n📋 Step-by-Step Guide:\n\n1️⃣ Visit Dashboard:\n   🔗 https://api.devmaxwell.site\n\n2️⃣ Create Account:\n   • Sign up with your email\n   • Verify your account\n   • Complete your profile\n\n3️⃣ Generate API Key:\n   • Go to "API Keys" section\n   • Click "Create New Key"\n   • Copy your API key\n\n4️⃣ Connect WhatsApp:\n   • Use: /connect <phone> <api_key>\n   • Example: /connect 254762917014 your_api_key_here\n\n💡 Need Help?\n• Type /help for all commands\n• Contact: @maxie_dev\n• Dashboard: https://api.devmaxwell.site\n\n🚀 Ready to connect? Get your API key now!`;
    
    console.log('📤 Sending welcome message...');
    safeSendMessage(chatId, welcomeMessage);
});

// Handle /help command
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const isOwner = chatId.toString() === settings.OWNER_ID;
    
    let helpText = `🤖 Zetech-MD Bot Commands\n\n🔗 Connection Commands:\n• /connect <phone> <api_key> - Connect WhatsApp with API key\n• /delsession <phone> - Delete session\n• /status - Check connection status\n\n🔑 API Key:\n• Get your API key from the dashboard\n• API key is required for all connections\n• ⚠️ Each API key can only be used once\n• 🔒 Sessions auto-disconnect when API keys expire\n• Dashboard: https://api.devmaxwell.site\n\n🆘 Support:\n• Contact: @maxie_dev\n• Bot: @ZetechMD_Bot`;
    
    if (isOwner) {
        helpText += `\n\n👑 Admin Commands:\n• /usedkeys - View all used API keys\n• /checkexpiry - Manually check API key expiration`;
    }
    
    safeSendMessage(chatId, helpText);
});

// Handle /testapi command for debugging
bot.onText(/\/testapi (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const apiKey = match[1];
    
    safeSendMessage(chatId, `🔍 Testing API Key...\n\n🔑 Key: ${apiKey.substring(0, 8)}...\n\n📋 Debug logs will be sent to owner's WhatsApp DM.`);
    
    const verification = await verifyApiKey(apiKey);
    
    if (verification.success) {
        safeSendMessage(chatId, `✅ API Key Test Successful!\n\n📋 Response:\n\`\`\`json\n${JSON.stringify(verification.data, null, 2)}\n\`\`\``);
    } else {
        safeSendMessage(chatId, `❌ API Key Test Failed!\n\n📋 Error:\n\`\`\`\n${verification.error}\n\`\`\``);
    }
});


// Handle /delete command
bot.onText(/\/delsession (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const ownerId = msg.from.id.toString();
    const phoneNumber = match[1];
    const sessionPath = path.join(__dirname, 'trash_baileys', `session_${phoneNumber}`);
    
    console.log(`🗑️ Deleting session for ${phoneNumber}...`);
    
    // Check if the phone number is actually connected
    const isConnected = global.activeConnections.has(phoneNumber);
    const isInConnectedUsers = connectedUsers[chatId] && connectedUsers[chatId].some(user => user.phoneNumber === phoneNumber);
    
    if (isConnected || isInConnectedUsers) {
        // Disconnect the WhatsApp connection if it exists
        if (isConnected) {
            try {
                const conn = global.activeConnections.get(phoneNumber);
                if (conn && conn.logout) {
                    await conn.logout();
                    console.log(`✅ Disconnected WhatsApp connection for ${phoneNumber}`);
                }
                global.activeConnections.delete(phoneNumber);
            } catch (error) {
                console.log(`⚠️ Error disconnecting ${phoneNumber}:`, error.message);
            }
        }
        
        // Remove from connected users
        if (connectedUsers[chatId]) {
            connectedUsers[chatId] = connectedUsers[chatId].filter(user => user.phoneNumber !== phoneNumber);
            saveConnectedUsers();
            console.log(`✅ Removed ${phoneNumber} from connected users`);
        }
        
        // Remove session directory if it exists
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            console.log(`✅ Deleted session directory for ${phoneNumber}`);
        }
        
        safeSendMessage(chatId, `🗑️ Session for ${phoneNumber} has been deleted.\n\n✅ WhatsApp connection disconnected\n✅ Session files removed\n✅ You can now request a new pairing code.`);
        
    } else {
        // Check if session directory exists but not connected
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
            safeSendMessage(chatId, `🗑️ Session files for ${phoneNumber} have been deleted.\n\nℹ️ No active connection was found, but session files were removed.`);
        } else {
            safeSendMessage(chatId, `❌ No session found for ${phoneNumber}.\n\n💡 It may have already been deleted or never existed.`);
        }
    }
});

// Handle /menu command

// Removed duplicate /start handler - using the one above with welcome message
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const connectedUser = connectedUsers[chatId];

    if (connectedUser && connectedUser.length > 0) {
        let statusText = `📊 Bot Status\n\n🔗 Connected Numbers:\n`;
        let hasActiveConnections = false;
        
        connectedUser.forEach(user => {
            const uptime = Math.floor((Date.now() - user.connectedAt) / 1000); // Runtime in seconds
            const isActive = global.activeConnections.has(user.phoneNumber);
            const status = isActive ? '🟢 Active' : '🔴 Disconnected';
            
            if (isActive) hasActiveConnections = true;
            
            statusText += `📱 ${user.phoneNumber} (Uptime: ${uptime}s) ${status}\n`;
        });
        
        if (!hasActiveConnections) {
            statusText += `\n⚠️ No active WhatsApp connections found.\n💡 Use /connect to reconnect.`;
        }
        
        safeSendMessage(chatId, statusText);
    } else {
        safeSendMessage(chatId, `📊 Bot Status\n\n❌ You have no registered numbers.\n\n💡 Use /connect to get started!`);
    }
});

// Command to check used API keys (for debugging/admin purposes)
bot.onText(/\/usedkeys/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Only allow owner to check used keys
    if (chatId.toString() !== settings.OWNER_ID) {
        safeSendMessage(chatId, `❌ Access Denied\n\nThis command is only available to the bot owner.`);
        return;
    }
    
    await global.loadDatabase();
    const usedKeys = global.db.data.usedApiKeys || {};
    const keyCount = Object.keys(usedKeys).length;
    
    if (keyCount === 0) {
        safeSendMessage(chatId, `📋 Used API Keys\n\nNo API keys have been used yet.`);
        return;
    }
    
    let keysText = `📋 Used API Keys\n\n📊 Total Used: ${keyCount}\n\n`;
    
    for (const [apiKey, data] of Object.entries(usedKeys)) {
        const usedTime = new Date(data.usedAt).toLocaleString();
        keysText += `🔑 ${apiKey.substring(0, 8)}...\n`;
        keysText += `   • Phone: ${data.phoneNumber}\n`;
        keysText += `   • Used: ${usedTime}\n`;
        keysText += `   • Chat: ${data.telegramChatId}\n\n`;
    }
    
    safeSendMessage(chatId, keysText);
});

// Command to manually check API key expiration (for testing/admin purposes)
bot.onText(/\/checkexpiry/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Only allow owner to check expiration
    if (chatId.toString() !== settings.OWNER_ID) {
        safeSendMessage(chatId, `❌ Access Denied\n\nThis command is only available to the bot owner.`);
        return;
    }
    
    safeSendMessage(chatId, `🔍 Checking API key expiration...\n\nThis may take a few moments.`);
    
    try {
        await checkAllSessionsForExpiration();
        safeSendMessage(chatId, `✅ API key expiration check completed.\n\n📋 Check console logs for detailed results.`);
    } catch (error) {
        safeSendMessage(chatId, `❌ Error during expiration check:\n\n\`\`\`\n${error.message}\n\`\`\``);
    }
});

// Function to load all session files
async function loadAllSessions() {
    const sessionsDir = path.join(__dirname, 'trash_baileys');
    if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir);
    }

    // If cloud storage is initialized, try to load sessions from cloud first
    if (global.cloudInitialized && global.cloudStorage) {
        console.log('🔄 Loading sessions from cloud...');
        try {
            // Load all sessions from cloud
            const cloudSessions = await global.cloudStorage.listCloudFiles();
            const sessionFiles = cloudSessions.filter(file => file.startsWith('trash_baileys/session_'));
            
            for (const cloudFile of sessionFiles) {
                const phoneNumber = cloudFile.replace('trash_baileys/session_', '');
                console.log(`📥 Loading session from cloud: ${phoneNumber}`);
                await startWhatsAppBot(phoneNumber);
            }
        } catch (error) {
            console.error('❌ Error loading sessions from cloud:', error.message);
        }
    }

    // Also load any local sessions that might not be in cloud
    const sessionFiles = fs.readdirSync(sessionsDir);
    for (const file of sessionFiles) {
        if (file.startsWith('session_')) {
            const phoneNumber = file.replace('session_', '');
            console.log(`📱 Loading local session: ${phoneNumber}`);
            await startWhatsAppBot(phoneNumber);
        }
    }
}

// Initialize cloud storage and load sessions
async function startBot() {
    try {
        // Create process lock to prevent multiple instances
        await createProcessLock();
        
        // Load connected users first
        loadConnectedUsers();
        
        // Clean up any duplicate entries
        cleanupConnectedUsers();
        
        // Initialize log collector
        console.log('📊 Initializing log collector...');
        const logBotToken = settings.LOG_BOT_TOKEN || null;
        const logGroupId = settings.LOG_GROUP_ID || null;
        global.logCollector.initialize(logBotToken, logGroupId, bot);
        
        // Start log scheduler (configurable interval)
        if (logBotToken && logGroupId) {
            const logInterval = parseInt(settings.LOG_MIN) || 30; // Default to 30 minutes if not specified
            global.logCollector.startScheduler(logInterval);
            console.log(`✅ Log collector ready - logs will be sent every ${logInterval} minutes`);
        } else {
            console.log('⚠️ Log collector ready but no Telegram credentials provided');
        }
        
        // Initialize cloud storage
        console.log('🚀 Starting ZETECH-MD Bot...');
        const cloudReady = await initializeCloudStorage();
        
        if (cloudReady) {
            console.log('✅ Cloud storage ready, loading sessions...');
        } else {
            console.log('⚠️ Cloud storage not available, using local storage only');
        }
        
        // Load all sessions (from cloud and local)
        await loadAllSessions();
        
        console.log('🎉 ZETECH-MD Bot is ready!');
        
    } catch (error) {
        console.error('❌ Error starting bot:', error.message);
    }
}

// Process management and cleanup
let isShuttingDown = false;

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.log('Shutdown already in progress...');
        return;
    }
    
    isShuttingDown = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
        // Stop bot polling
        if (bot && bot.stopPolling) {
            console.log('🛑 Stopping Telegram bot polling...');
            bot.stopPolling();
        }
        
        // Close all WhatsApp connections
        console.log('🛑 Closing WhatsApp connections...');
        for (const [phoneNumber, conn] of global.activeConnections) {
            try {
                if (conn && conn.logout) {
                    await conn.logout();
                    console.log(`✅ Disconnected ${phoneNumber}`);
                }
            } catch (error) {
                console.log(`⚠️ Error disconnecting ${phoneNumber}:`, error.message);
            }
        }
        
        // Clear global connections
        global.activeConnections.clear();
        global.connectionAttempts.clear();
        
        // Clean up lock file
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
            console.log('🔓 Process lock file removed');
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon restart

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Don't exit the process, just log the error
});

// Start the bot
startBot().then(() => {
    console.log('✅ Telegram bot is running...');
    console.log('🔍 Bot status check:');
    console.log(`   • Bot initialized: ${botInitialized}`);
    console.log(`   • Bot object exists: ${!!bot}`);
    console.log(`   • Bot token configured: ${!!BOT_TOKEN}`);
    console.log('📱 Bot is ready to receive commands!');
}).catch((error) => {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
});

// Set up periodic API key expiration check (every 30 minutes)
setInterval(async () => {
    try {
        console.log('[EXPIRY CHECK] Starting scheduled API key expiration check...');
        await checkAllSessionsForExpiration();
    } catch (error) {
        console.log('[EXPIRY CHECK] Error in scheduled expiration check:', error.message);
    }
}, 30 * 60 * 1000); // 30 minutes

console.log('[EXPIRY CHECK] API key expiration monitoring started (every 30 minutes)');


let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})
