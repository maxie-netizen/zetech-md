const Mega = require('megajs');
const fs = require('fs');
const path = require('path');

class CloudStorage {
    constructor() {
        this.mega = null;
        this.isLoggedIn = false;
        this.rootFolder = null;
        this.config = {
            email: 'maxwellirungu64@gmail.com',
            password: '@Maxi2000',
            folderName: 'ZETECH-MD-Data'
        };
    }

    async initialize() {
        try {
            if (!this.config.email || !this.config.password) {
                console.log('⚠️ Mega credentials not set. Please set MEGA_EMAIL and MEGA_PASSWORD environment variables.');
                return false;
            }

            this.mega = new Mega({
                email: this.config.email,
                password: this.config.password
            });

            await this.mega.login();
            this.isLoggedIn = true;
            console.log('✅ Connected to Mega.nz cloud storage');

            // Create or find the bot data folder
            await this.ensureDataFolder();
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Mega.nz:', error.message);
            return false;
        }
    }

    async ensureDataFolder() {
        try {
            // Check if folder already exists
            const existingFolder = this.mega.find(this.config.folderName);
            if (existingFolder) {
                this.rootFolder = existingFolder;
                console.log(`✅ Bot data folder found: ${this.config.folderName}`);
                return;
            }
            
            // Create folder if it doesn't exist
            const folder = await this.mega.mkdir(this.config.folderName);
            this.rootFolder = folder;
            console.log(`✅ Bot data folder created: ${this.config.folderName}`);
        } catch (error) {
            console.error('❌ Failed to create data folder:', error.message);
        }
    }

    async uploadFile(localPath, cloudPath) {
        try {
            if (!this.isLoggedIn) {
                console.log('❌ Not connected to Mega.nz');
                return false;
            }

            if (!fs.existsSync(localPath)) {
                console.log(`❌ Local file not found: ${localPath}`);
                return false;
            }

            const fileBuffer = fs.readFileSync(localPath);
            const fileName = path.basename(cloudPath);
            
            // Ensure target folder exists
            await this.ensureDataFolder();
            if (!this.rootFolder) {
                console.log(`❌ Could not create/find target folder: ${this.config.folderName}`);
                return false;
            }
            
            // Check if file already exists in cloud
            const fileExists = await this.fileExistsInCloud(fileName);
            
            if (fileExists) {
                console.log(`ℹ️ File already exists in cloud: ${fileName}`);
                return true; // File already exists, consider it synced
            }
            
            // Upload file to the folder
            await this.mega.upload(fileBuffer, fileName, this.rootFolder);
            console.log(`✅ Uploaded: ${localPath} → ${fileName}`);
            return true;
        } catch (error) {
            console.error(`❌ Upload failed for ${localPath}:`, error.message);
            return false;
        }
    }

    async downloadFile(cloudPath, localPath) {
        try {
            if (!this.isLoggedIn) {
                console.log('❌ Not connected to Mega.nz');
                return false;
            }

            const fileName = path.basename(cloudPath);
            
            // Ensure target folder exists
            await this.ensureDataFolder();
            if (!this.rootFolder) {
                console.log(`❌ Target folder not found: ${this.config.folderName}`);
                return false;
            }
            
            // Find the file in the folder
            const files = this.mega.find(fileName, this.rootFolder);
            
            if (!files) {
                console.log(`ℹ️ File not found in cloud: ${fileName}`);
                return false; // File doesn't exist in cloud, that's okay
            }
            
            const fileData = await this.mega.download(files);
            
            // Ensure directory exists
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(localPath, fileData);
            console.log(`✅ Downloaded: ${fileName} → ${localPath}`);
            return true;
        } catch (error) {
            console.error(`❌ Download failed for ${cloudPath}:`, error.message);
            return false;
        }
    }

    async syncSession(sessionId) {
        try {
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);
            
            if (fs.existsSync(localSessionDir)) {
                // Upload session files to cloud
                const files = fs.readdirSync(localSessionDir);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const localFile = path.join(localSessionDir, file);
                        const cloudFile = `${sessionPath}/${file}`;
                        await this.uploadFile(localFile, cloudFile);
                    }
                }
                console.log(`✅ Synced session: ${sessionId}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`❌ Session sync failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    async loadSession(sessionId) {
        try {
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);
            
            // Create local session directory
            if (!fs.existsSync(localSessionDir)) {
                fs.mkdirSync(localSessionDir, { recursive: true });
            }

            // Try to download session files from cloud
            const folders = await this.mega.files.find({ name: this.config.folderName });
            if (folders && folders.length > 0) {
                const targetFolder = folders[0];
                const files = await this.mega.files.find({ parent: targetFolder.id });
                
                if (files && files.length > 0) {
                    for (const file of files) {
                        if (file.name.endsWith('.json') && file.name.includes(`session_${sessionId}`)) {
                            const localFile = path.join(localSessionDir, file.name);
                            const cloudFile = `${sessionPath}/${file.name}`;
                            await this.downloadFile(cloudFile, localFile);
                        }
                    }
                    console.log(`✅ Loaded session from cloud: ${sessionId}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(`❌ Session load failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    async syncDatabase() {
        try {
            // Auto-detect all JSON files in the project
            const jsonFiles = await this.findJsonFiles(process.cwd());
            let syncedCount = 0;
            let skippedCount = 0;
            
            for (const jsonFile of jsonFiles) {
                const relativePath = path.relative(process.cwd(), jsonFile);
                const result = await this.uploadFile(jsonFile, relativePath);
                if (result) {
                    syncedCount++;
                } else {
                    skippedCount++;
                }
            }
            console.log(`✅ Synced ${syncedCount} files, skipped ${skippedCount} files`);
            return true;
        } catch (error) {
            console.error('❌ Database sync failed:', error.message);
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
                    // Skip node_modules and other unnecessary directories
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

    async loadDatabase() {
        try {
            // Auto-detect and load all JSON files from cloud
            const cloudFiles = await this.listCloudFiles();
            let loadedCount = 0;
            let skippedCount = 0;
            
            for (const cloudFile of cloudFiles) {
                if (cloudFile.endsWith('.json')) {
                    const localPath = path.join(process.cwd(), cloudFile);
                    const dir = path.dirname(localPath);
                    
                    // Ensure directory exists
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    // Try to download from cloud
                    const result = await this.downloadFile(cloudFile, localPath);
                    if (result) {
                        loadedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }
            console.log(`✅ Loaded ${loadedCount} files, skipped ${skippedCount} files`);
            return true;
        } catch (error) {
            console.error('❌ Database load failed:', error.message);
            return false;
        }
    }

    async fileExistsInCloud(fileName) {
        try {
            if (!this.rootFolder) {
                await this.ensureDataFolder();
            }
            
            if (!this.rootFolder) {
                return false;
            }
            
            const files = this.mega.find(fileName, this.rootFolder);
            
            return files !== null;
        } catch (error) {
            console.error(`❌ Failed to check if file exists: ${fileName}`, error.message);
            return false;
        }
    }

    async listCloudFiles() {
        try {
            // Use the correct Mega.js API method
            const folder = this.mega.find(this.config.folderName);
            if (folder) {
                const folderFiles = folder.children || [];
                return folderFiles.map(file => file.name);
            }
            return [];
        } catch (error) {
            console.error('❌ Failed to list cloud files:', error.message);
            return [];
        }
    }

    async syncAll() {
        try {
            console.log('🔄 Starting full cloud sync...');
            
            // Sync database files
            await this.syncDatabase();
            
            // Sync all sessions
            const sessionsDir = path.join(process.cwd(), 'trash_baileys');
            if (fs.existsSync(sessionsDir)) {
                const sessions = fs.readdirSync(sessionsDir);
                for (const session of sessions) {
                    if (session.startsWith('session_')) {
                        const sessionId = session.replace('session_', '');
                        await this.syncSession(sessionId);
                    }
                }
            }
            
            console.log('✅ Full cloud sync completed');
            return true;
        } catch (error) {
            console.error('❌ Full sync failed:', error.message);
            return false;
        }
    }

    async loadAll() {
        try {
            console.log('🔄 Loading all data from cloud...');
            
            // Load database files
            await this.loadDatabase();
            
            console.log('✅ All data loaded from cloud');
            return true;
        } catch (error) {
            console.error('❌ Load all failed:', error.message);
            return false;
        }
    }

    async disconnect() {
        try {
            if (this.mega) {
                await this.mega.logout();
                this.isLoggedIn = false;
                console.log('✅ Disconnected from Mega.nz');
            }
        } catch (error) {
            console.error('❌ Disconnect failed:', error.message);
        }
    }
}

module.exports = CloudStorage;
