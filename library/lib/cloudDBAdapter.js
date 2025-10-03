const CloudStorage = require('./cloudStorage');
const fs = require('fs');
const path = require('path');

class CloudDBAdapter {
    constructor() {
        this.cloudStorage = new CloudStorage();
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.autoSyncTimer = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Cloud Database Adapter...');
            
            // Initialize cloud storage
            const connected = await this.cloudStorage.initialize();
            if (!connected) {
                console.log('⚠️ Cloud storage not available, using local storage only');
                return false;
            }

            // Load all data from cloud
            await this.cloudStorage.loadAll();
            
            // Start auto-sync
            this.startAutoSync();
            
            this.isInitialized = true;
            console.log('✅ Cloud Database Adapter initialized');
            return true;
        } catch (error) {
            console.error('❌ Cloud DB initialization failed:', error.message);
            return false;
        }
    }

    startAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }

        this.autoSyncTimer = setInterval(async () => {
            try {
                await this.syncToCloud();
            } catch (error) {
                console.error('❌ Auto-sync failed:', error.message);
            }
        }, this.syncInterval);

        console.log(`✅ Auto-sync started (every ${this.syncInterval / 1000} seconds)`);
    }

    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
            console.log('✅ Auto-sync stopped');
        }
    }

    async syncToCloud() {
        try {
            if (!this.isInitialized) return;
            
            console.log('🔄 Syncing data to cloud...');
            await this.cloudStorage.syncAll();
        } catch (error) {
            console.error('❌ Cloud sync failed:', error.message);
        }
    }

    async syncSession(sessionId) {
        try {
            if (!this.isInitialized) return;
            await this.cloudStorage.syncSession(sessionId);
        } catch (error) {
            console.error(`❌ Session sync failed for ${sessionId}:`, error.message);
        }
    }

    async loadSession(sessionId) {
        try {
            if (!this.isInitialized) return false;
            return await this.cloudStorage.loadSession(sessionId);
        } catch (error) {
            console.error(`❌ Session load failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    // Enhanced database operations with cloud sync
    async saveDatabaseFile(filePath, data) {
        try {
            // Save locally first
            const fullPath = path.join(process.cwd(), filePath);
            const dir = path.dirname(fullPath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
            
            // Auto-sync to cloud if it's a JSON file
            if (this.isInitialized && filePath.endsWith('.json')) {
                const relativePath = path.relative(process.cwd(), fullPath);
                await this.cloudStorage.uploadFile(fullPath, relativePath);
            }
            
            return true;
        } catch (error) {
            console.error(`❌ Save database file failed for ${filePath}:`, error.message);
            return false;
        }
    }

    async loadDatabaseFile(filePath) {
        try {
            const fullPath = path.join(process.cwd(), filePath);
            
            // Try to load from cloud first
            if (this.isInitialized) {
                const cloudLoaded = await this.cloudStorage.downloadFile(filePath, fullPath);
                if (cloudLoaded && fs.existsSync(fullPath)) {
                    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                }
            }
            
            // Fallback to local file
            if (fs.existsSync(fullPath)) {
                return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            }
            
            return null;
        } catch (error) {
            console.error(`❌ Load database file failed for ${filePath}:`, error.message);
            return null;
        }
    }

    // Premium user management with cloud sync
    async addPremiumUser(userId, data = {}) {
        try {
            const premiumFile = 'library/database/premium.json';
            let premiumData = await this.loadDatabaseFile(premiumFile) || {};
            
            premiumData[userId] = {
                ...data,
                addedAt: new Date().toISOString(),
                isPremium: true
            };
            
            await this.saveDatabaseFile(premiumFile, premiumData);
            console.log(`✅ Added premium user: ${userId}`);
            return true;
        } catch (error) {
            console.error(`❌ Add premium user failed for ${userId}:`, error.message);
            return false;
        }
    }

    async removePremiumUser(userId) {
        try {
            const premiumFile = 'library/database/premium.json';
            let premiumData = await this.loadDatabaseFile(premiumFile) || {};
            
            if (premiumData[userId]) {
                delete premiumData[userId];
                await this.saveDatabaseFile(premiumFile, premiumData);
                console.log(`✅ Removed premium user: ${userId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Remove premium user failed for ${userId}:`, error.message);
            return false;
        }
    }

    async isPremiumUser(userId) {
        try {
            const premiumFile = 'library/database/premium.json';
            const premiumData = await this.loadDatabaseFile(premiumFile) || {};
            return premiumData[userId]?.isPremium || false;
        } catch (error) {
            console.error(`❌ Check premium user failed for ${userId}:`, error.message);
            return false;
        }
    }

    // Chat and message management with cloud sync
    async saveChat(chatId, chatData) {
        try {
            const chatsFile = 'store/chats.json';
            let chats = await this.loadDatabaseFile(chatsFile) || {};
            
            chats[chatId] = {
                ...chatData,
                lastUpdated: new Date().toISOString()
            };
            
            await this.saveDatabaseFile(chatsFile, chats);
            return true;
        } catch (error) {
            console.error(`❌ Save chat failed for ${chatId}:`, error.message);
            return false;
        }
    }

    async getChat(chatId) {
        try {
            const chatsFile = 'store/chats.json';
            const chats = await this.loadDatabaseFile(chatsFile) || {};
            return chats[chatId] || null;
        } catch (error) {
            console.error(`❌ Get chat failed for ${chatId}:`, error.message);
            return null;
        }
    }

    async saveMessage(messageId, messageData) {
        try {
            const messagesFile = 'store/messages.json';
            let messages = await this.loadDatabaseFile(messagesFile) || {};
            
            messages[messageId] = {
                ...messageData,
                savedAt: new Date().toISOString()
            };
            
            await this.saveDatabaseFile(messagesFile, messages);
            return true;
        } catch (error) {
            console.error(`❌ Save message failed for ${messageId}:`, error.message);
            return false;
        }
    }

    async getMessage(messageId) {
        try {
            const messagesFile = 'store/messages.json';
            const messages = await this.loadDatabaseFile(messagesFile) || {};
            return messages[messageId] || null;
        } catch (error) {
            console.error(`❌ Get message failed for ${messageId}:`, error.message);
            return null;
        }
    }

    // Manual sync operations
    async forceSync() {
        try {
            console.log('🔄 Force syncing all data to cloud...');
            await this.syncToCloud();
            console.log('✅ Force sync completed');
            return true;
        } catch (error) {
            console.error('❌ Force sync failed:', error.message);
            return false;
        }
    }

    async forceLoad() {
        try {
            console.log('🔄 Force loading all data from cloud...');
            await this.cloudStorage.loadAll();
            console.log('✅ Force load completed');
            return true;
        } catch (error) {
            console.error('❌ Force load failed:', error.message);
            return false;
        }
    }

    async disconnect() {
        try {
            this.stopAutoSync();
            await this.cloudStorage.disconnect();
            this.isInitialized = false;
            console.log('✅ Cloud DB Adapter disconnected');
        } catch (error) {
            console.error('❌ Disconnect failed:', error.message);
        }
    }
}

module.exports = CloudDBAdapter;