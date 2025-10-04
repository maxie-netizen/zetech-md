const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

class LogCollector {
    constructor() {
        this.logs = [];
        this.maxLogs = 10000; // Maximum number of logs to keep in memory
        this.telegramBot = null;
        this.telegramGroupId = null;
        this.telegramBotToken = null;
        this.isInitialized = false;
        this.logFilePath = path.join(__dirname, '../../logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logFilePath)) {
            fs.mkdirSync(this.logFilePath, { recursive: true });
        }
        
        // Override console methods to capture logs
        this.setupConsoleCapture();
    }
    
    setupConsoleCapture() {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleInfo = console.info;
        
        const captureLog = (level, args) => {
            const timestamp = new Date().toISOString();
            
            // Clean message from ANSI color codes and format properly
            const cleanMessage = args.map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                }
                // Remove ANSI color codes
                return String(arg).replace(/\x1b\[[0-9;]*m/g, '');
            }).join(' ');
            
            // Determine log type based on content
            const logType = this.determineLogType(cleanMessage);
            
            const logEntry = {
                timestamp,
                level,
                message: cleanMessage,
                type: logType,
                formatted: `[${timestamp}] [${level.toUpperCase()}] ${cleanMessage}`
            };
            
            this.addLog(logEntry);
            
            // Call original console method
            if (level === 'log') originalConsoleLog.apply(console, args);
            else if (level === 'error') originalConsoleError.apply(console, args);
            else if (level === 'warn') originalConsoleWarn.apply(console, args);
            else if (level === 'info') originalConsoleInfo.apply(console, args);
        };
        
        console.log = (...args) => captureLog('log', args);
        console.error = (...args) => captureLog('error', args);
        console.warn = (...args) => captureLog('warn', args);
        console.info = (...args) => captureLog('info', args);
    }
    
    determineLogType(message) {
        // Check if it's a WhatsApp message
        if (message.includes('=> From') || message.includes('=> In') || 
            message.includes('[ MESSAGE ]') || message.includes('WhatsApp') ||
            message.includes('@s.whatsapp.net') || message.includes('@g.us')) {
            return 'whatsapp';
        }
        
        // Check if it's a terminal/system log
        if (message.includes('[CONNECTION]') || message.includes('[DEBUG]') ||
            message.includes('Session') || message.includes('Credentials') ||
            message.includes('Bot') || message.includes('Starting') ||
            message.includes('Error') || message.includes('Warning')) {
            return 'terminal';
        }
        
        // Default to terminal
        return 'terminal';
    }
    
    addLog(logEntry) {
        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }
    
    initialize(telegramBotToken, telegramGroupId, sharedBot = null) {
        this.telegramBotToken = telegramBotToken;
        this.telegramGroupId = telegramGroupId;
        
        if (telegramBotToken && telegramGroupId) {
            // Use shared bot instance if provided, otherwise create a new one
            if (sharedBot) {
                this.telegramBot = sharedBot;
                console.log('📊 Log collector using shared bot instance');
            } else {
                this.telegramBot = new TelegramBot(telegramBotToken, { polling: false });
                console.log('📊 Log collector created new bot instance (no polling)');
            }
            this.isInitialized = true;
            console.log('📊 Log collector initialized with Telegram integration');
        } else {
            console.log('⚠️ Log collector initialized without Telegram integration');
        }
    }
    
    getLogsAsText() {
        return this.logs.map(log => log.formatted).join('\n');
    }
    
    getTerminalLogsAsText() {
        return this.logs
            .filter(log => log.type === 'terminal')
            .map(log => log.formatted)
            .join('\n');
    }
    
    getWhatsAppLogsAsText() {
        return this.logs
            .filter(log => log.type === 'whatsapp')
            .map(log => log.formatted)
            .join('\n');
    }
    
    async sendLogsToTelegram() {
        if (!this.isInitialized || !this.telegramBot) {
            console.log('❌ Telegram bot not initialized for log sending');
            return false;
        }
        
        try {
            // Check if logs directory exists
            if (!fs.existsSync(this.logFilePath)) {
                console.log('⚠️ Log directory does not exist, creating it...');
                fs.mkdirSync(this.logFilePath, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const terminalLogs = this.getTerminalLogsAsText();
            const whatsappLogs = this.getWhatsAppLogsAsText();
            
            // Only send logs if there are actual logs to send
            if (!terminalLogs.trim() && !whatsappLogs.trim()) {
                console.log('📝 No logs to send to Telegram');
                return true;
            }
            
            // Create terminal logs file only if there are terminal logs
            if (terminalLogs.trim()) {
                const terminalFileName = `terminal-logs-${timestamp}.txt`;
                const terminalFilePath = path.join(this.logFilePath, terminalFileName);
                fs.writeFileSync(terminalFilePath, terminalLogs, 'utf8');
                
                // Verify file was created and has content
                if (fs.existsSync(terminalFilePath) && fs.statSync(terminalFilePath).size > 0) {
                    const terminalFileStream = fs.createReadStream(terminalFilePath);
                    await this.telegramBot.sendDocument(this.telegramGroupId, terminalFileStream, {
                        caption: `🖥️ Terminal Logs - ${new Date().toLocaleString()}\n📊 Terminal logs: ${this.logs.filter(log => log.type === 'terminal').length}\n⏰ Generated at: ${new Date().toISOString()}`
                    });
                    console.log(`📤 Terminal logs sent: ${terminalFileName}`);
                }
            }
            
            // Create WhatsApp logs file only if there are WhatsApp logs
            if (whatsappLogs.trim()) {
                const whatsappFileName = `whatsapp-logs-${timestamp}.txt`;
                const whatsappFilePath = path.join(this.logFilePath, whatsappFileName);
                fs.writeFileSync(whatsappFilePath, whatsappLogs, 'utf8');
                
                // Verify file was created and has content
                if (fs.existsSync(whatsappFilePath) && fs.statSync(whatsappFilePath).size > 0) {
                    const whatsappFileStream = fs.createReadStream(whatsappFilePath);
                    await this.telegramBot.sendDocument(this.telegramGroupId, whatsappFileStream, {
                        caption: `📱 WhatsApp Messages - ${new Date().toLocaleString()}\n📊 WhatsApp messages: ${this.logs.filter(log => log.type === 'whatsapp').length}\n⏰ Generated at: ${new Date().toISOString()}`
                    });
                    console.log(`📤 WhatsApp logs sent: ${whatsappFileName}`);
                }
            }
            
            // Clean up old log files (keep only last 5)
            this.cleanupOldLogFiles();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to send logs to Telegram:', error.message);
            return false;
        }
    }
    
    cleanupOldLogFiles() {
        try {
            // Clean up old terminal log files
            const terminalFiles = fs.readdirSync(this.logFilePath)
                .filter(file => file.startsWith('terminal-logs-') && file.endsWith('.txt'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logFilePath, file),
                    stats: fs.statSync(path.join(this.logFilePath, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);
            
            // Keep only the last 5 terminal log files
            if (terminalFiles.length > 5) {
                terminalFiles.slice(5).forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Cleaned up old terminal log file: ${file.name}`);
                });
            }
            
            // Clean up old WhatsApp log files
            const whatsappFiles = fs.readdirSync(this.logFilePath)
                .filter(file => file.startsWith('whatsapp-logs-') && file.endsWith('.txt'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logFilePath, file),
                    stats: fs.statSync(path.join(this.logFilePath, file))
                }))
                .sort((a, b) => b.stats.mtime - a.stats.mtime);
            
            // Keep only the last 5 WhatsApp log files
            if (whatsappFiles.length > 5) {
                whatsappFiles.slice(5).forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️ Cleaned up old WhatsApp log file: ${file.name}`);
                });
            }
        } catch (error) {
            console.error('❌ Failed to cleanup old log files:', error.message);
        }
    }
    
    startScheduler(intervalMinutes = 30) {
        if (!this.isInitialized) {
            console.log('❌ Log collector not initialized. Cannot start scheduler.');
            return;
        }
        
        const intervalMs = intervalMinutes * 60 * 1000;
        
        console.log(`⏰ Log scheduler started - will send logs every ${intervalMinutes} minutes`);
        
        setInterval(async () => {
            console.log('📤 Scheduled log sending triggered...');
            await this.sendLogsToTelegram();
        }, intervalMs);
    }
    
    getStats() {
        const terminalLogs = this.logs.filter(log => log.type === 'terminal').length;
        const whatsappLogs = this.logs.filter(log => log.type === 'whatsapp').length;
        
        return {
            totalLogs: this.logs.length,
            terminalLogs: terminalLogs,
            whatsappLogs: whatsappLogs,
            isInitialized: this.isInitialized,
            hasTelegramBot: !!this.telegramBot,
            telegramGroupId: this.telegramGroupId
        };
    }
}

module.exports = LogCollector;
