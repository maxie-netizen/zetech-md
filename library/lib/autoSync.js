const fs = require('fs');
const path = require('path');
const CloudStorage = require('./cloudStorage');

class AutoSync {
    constructor() {
        this.cloudStorage = new CloudStorage();
        this.watchers = new Map();
        this.isInitialized = false;
        this.syncQueue = new Set();
        this.syncTimeout = null;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Auto-Sync...');
            
            // Initialize cloud storage
            const connected = await this.cloudStorage.initialize();
            if (!connected) {
                console.log('⚠️ Cloud storage not available, auto-sync disabled');
                return false;
            }

            // Start watching for file changes
            await this.startWatching();
            
            this.isInitialized = true;
            console.log('✅ Auto-Sync initialized');
            return true;
        } catch (error) {
            console.error('❌ Auto-Sync initialization failed:', error.message);
            return false;
        }
    }

    async startWatching() {
        try {
            // Watch main directories for JSON files
            const watchDirs = [
                'store',
                'library/database',
                'message_data',
                'trash_baileys'
            ];

            for (const dir of watchDirs) {
                const fullPath = path.join(process.cwd(), dir);
                if (fs.existsSync(fullPath)) {
                    await this.watchDirectory(fullPath);
                }
            }

            // Watch root directory for JSON files
            await this.watchDirectory(process.cwd());
            
            // Start monitoring for new sessions
            await this.startSessionMonitoring();
            
            // Start periodic session check
            this.startPeriodicSessionCheck();
            
            console.log('✅ File watching started');
        } catch (error) {
            console.error('❌ Failed to start watching:', error.message);
        }
    }

    async startSessionMonitoring() {
        try {
            const trashBaileysPath = path.join(process.cwd(), 'trash_baileys');
            
            if (fs.existsSync(trashBaileysPath)) {
                // Monitor the trash_baileys directory for new session folders
                const sessionWatcher = fs.watch(trashBaileysPath, async (eventType, filename) => {
                    if (eventType === 'rename' && filename && filename.startsWith('session_')) {
                        const sessionId = filename.replace('session_', '');
                        const sessionPath = path.join(trashBaileysPath, filename);
                        
                        if (fs.existsSync(sessionPath)) {
                            console.log(`🔄 New session folder detected: ${filename}`);
                            await this.handleNewSession(sessionId);
                        }
                    }
                });
                
                this.watchers.set('trash_baileys_sessions', sessionWatcher);
                console.log('✅ Session monitoring started');
            }
        } catch (error) {
            console.error('❌ Failed to start session monitoring:', error.message);
        }
    }

    async watchDirectory(dirPath) {
        try {
            const watcher = fs.watch(dirPath, { recursive: true }, async (eventType, filename) => {
                if (filename) {
                    const fullPath = path.join(dirPath, filename);
                    
                    // Handle different file events
                    if (eventType === 'rename') {
                        // New file or folder created
                        if (fs.existsSync(fullPath)) {
                            const stat = fs.statSync(fullPath);
                            
                            if (stat.isDirectory()) {
                                // New directory created - watch it and sync any JSON files in it
                                console.log(`📁 New directory detected: ${fullPath}`);
                                await this.watchDirectory(fullPath);
                                await this.syncDirectoryContents(fullPath);
                                
                                // Check if it's a new session directory
                                if (fullPath.includes('trash_baileys/session_')) {
                                    const sessionId = path.basename(fullPath).replace('session_', '');
                                    await this.handleNewSession(sessionId);
                                }
                            } else if (filename.endsWith('.json')) {
                                // New JSON file created - sync immediately
                                console.log(`📄 New JSON file detected: ${fullPath}`);
                                this.queueForSync(fullPath);
                            }
                        }
                    } else if (eventType === 'change' && filename.endsWith('.json')) {
                        // Existing JSON file modified
                        this.queueForSync(fullPath);
                    }
                }
            });

            this.watchers.set(dirPath, watcher);
            console.log(`✅ Watching directory: ${dirPath}`);
        } catch (error) {
            console.error(`❌ Failed to watch directory ${dirPath}:`, error.message);
        }
    }

    async syncDirectoryContents(dirPath) {
        try {
            console.log(`🔄 Syncing contents of new directory: ${dirPath}`);
            
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Recursively sync subdirectories
                    await this.syncDirectoryContents(fullPath);
                } else if (item.endsWith('.json')) {
                    // Sync JSON files immediately
                    const relativePath = path.relative(process.cwd(), fullPath);
                    await this.cloudStorage.uploadFile(fullPath, relativePath);
                    console.log(`✅ Synced new file: ${relativePath}`);
                }
            }
        } catch (error) {
            console.error(`❌ Failed to sync directory contents: ${dirPath}`, error.message);
        }
    }

    queueForSync(filePath) {
        try {
            const relativePath = path.relative(process.cwd(), filePath);
            this.syncQueue.add(relativePath);
            
            // Debounce sync - wait 2 seconds after last change
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout);
            }
            
            this.syncTimeout = setTimeout(() => {
                this.processSyncQueue();
            }, 2000);
        } catch (error) {
            console.error(`❌ Failed to queue file for sync: ${filePath}`, error.message);
        }
    }

    async processSyncQueue() {
        try {
            if (this.syncQueue.size === 0) return;

            console.log(`🔄 Syncing ${this.syncQueue.size} files to cloud...`);
            
            for (const filePath of this.syncQueue) {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    await this.cloudStorage.uploadFile(fullPath, filePath);
                }
            }
            
            this.syncQueue.clear();
            console.log('✅ Auto-sync completed');
        } catch (error) {
            console.error('❌ Auto-sync failed:', error.message);
        }
    }

    async syncSession(sessionId) {
        try {
            if (!this.isInitialized) return;
            
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);
            
            if (fs.existsSync(localSessionDir)) {
                const files = fs.readdirSync(localSessionDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const localFile = path.join(localSessionDir, file);
                        const cloudFile = `${sessionPath}/${file}`;
                        await this.cloudStorage.uploadFile(localFile, cloudFile);
                    }
                }
                console.log(`✅ Auto-synced session: ${sessionId}`);
            }
        } catch (error) {
            console.error(`❌ Auto-sync session failed for ${sessionId}:`, error.message);
        }
    }

    async handleNewSession(sessionId) {
        try {
            console.log(`🔄 New session detected: ${sessionId}`);
            
            // Wait a moment for all session files to be created
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Sync the entire session directory
            await this.syncSession(sessionId);
            
            console.log(`✅ New session synced to cloud: ${sessionId}`);
        } catch (error) {
            console.error(`❌ Failed to sync new session ${sessionId}:`, error.message);
        }
    }

    async loadSession(sessionId) {
        try {
            if (!this.isInitialized) return false;
            
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);
            
            // Create local session directory
            if (!fs.existsSync(localSessionDir)) {
                fs.mkdirSync(localSessionDir, { recursive: true });
            }

            // Try to download session files from cloud
            const cloudSessionPath = `${this.cloudStorage.config.folderName}/${sessionPath}`;
            try {
                const files = await this.cloudStorage.mega.list(cloudSessionPath);
                
                if (files && files.length > 0) {
                    for (const file of files) {
                        if (file.name.endsWith('.json')) {
                            const localFile = path.join(localSessionDir, file.name);
                            const cloudFile = `${sessionPath}/${file.name}`;
                            await this.cloudStorage.downloadFile(cloudFile, localFile);
                        }
                    }
                    console.log(`✅ Auto-loaded session from cloud: ${sessionId}`);
                    return true;
                }
            } catch (error) {
                // Session might not exist in cloud yet
                console.log(`ℹ️ Session ${sessionId} not found in cloud`);
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Auto-load session failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    async forceSync() {
        try {
            console.log('🔄 Force syncing all files...');
            
            // Find all JSON files
            const jsonFiles = await this.findJsonFiles(process.cwd());
            
            for (const jsonFile of jsonFiles) {
                const relativePath = path.relative(process.cwd(), jsonFile);
                await this.cloudStorage.uploadFile(jsonFile, relativePath);
            }
            
            console.log(`✅ Force sync completed - ${jsonFiles.length} files synced`);
            return true;
        } catch (error) {
            console.error('❌ Force sync failed:', error.message);
            return false;
        }
    }

    async findJsonFiles(dir) {
        const jsonFiles = [];
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip unnecessary directories
                    if (!['node_modules', '.git', 'tmp', 'logs'].includes(item)) {
                        const subFiles = await this.findJsonFiles(fullPath);
                        jsonFiles.push(...subFiles);
                    }
                } else if (item.endsWith('.json')) {
                    jsonFiles.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error.message);
        }
        
        return jsonFiles;
    }

    startPeriodicSessionCheck() {
        try {
            // Check for new sessions every 30 seconds
            setInterval(async () => {
                if (this.isInitialized) {
                    await this.checkForNewSessions();
                }
            }, 30000);
            
            console.log('✅ Periodic session check started (every 30 seconds)');
        } catch (error) {
            console.error('❌ Failed to start periodic session check:', error.message);
        }
    }

    async checkForNewSessions() {
        try {
            const trashBaileysPath = path.join(process.cwd(), 'trash_baileys');
            
            if (fs.existsSync(trashBaileysPath)) {
                const sessions = fs.readdirSync(trashBaileysPath)
                    .filter(item => item.startsWith('session_'))
                    .map(item => item.replace('session_', ''));
                
                for (const sessionId of sessions) {
                    const sessionPath = `trash_baileys/session_${sessionId}`;
                    const localSessionDir = path.join(process.cwd(), sessionPath);
                    
                    if (fs.existsSync(localSessionDir)) {
                        // Check if session has JSON files that need syncing
                        const files = fs.readdirSync(localSessionDir)
                            .filter(file => file.endsWith('.json'));
                        
                        if (files.length > 0) {
                            console.log(`🔄 Checking session ${sessionId} for new files...`);
                            await this.syncSession(sessionId);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to check for new sessions:', error.message);
        }
    }

    async disconnect() {
        try {
            // Stop all watchers
            for (const [dir, watcher] of this.watchers) {
                watcher.close();
            }
            this.watchers.clear();
            
            // Clear sync queue
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout);
            }
            this.syncQueue.clear();
            
            // Disconnect cloud storage
            await this.cloudStorage.disconnect();
            
            this.isInitialized = false;
            console.log('✅ Auto-Sync disconnected');
        } catch (error) {
            console.error('❌ Auto-Sync disconnect failed:', error.message);
        }
    }
}

module.exports = AutoSync;
