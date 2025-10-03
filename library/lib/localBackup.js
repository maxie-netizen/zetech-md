const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class LocalBackup {
    constructor() {
        this.isConnected = true; // Always connected for local backup
        this.backupDir = path.join(process.cwd(), 'backups');
        this.config = {
            maxBackups: 10, // Keep last 10 backups
            backupInterval: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        };
    }

    async initialize() {
        try {
            console.log('🔄 Initializing local backup system...');
            
            // Create backup directory if it doesn't exist
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
                console.log(`✅ Created backup directory: ${this.backupDir}`);
            }

            // Clean old backups
            await this.cleanOldBackups();
            
            console.log('✅ Local backup system ready');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize local backup:', error.message);
            return false;
        }
    }

    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `backup-${timestamp}`;
            const backupPath = path.join(this.backupDir, backupName);

            console.log(`📦 Creating backup: ${backupName}`);

            // Create backup directory
            fs.mkdirSync(backupPath, { recursive: true });

            // Copy important directories
            const dirsToBackup = [
                'store',
                'library/database',
                'message_data',
                'trash_baileys',
                'zetechplugs'
            ];

            let backedUpCount = 0;
            for (const dir of dirsToBackup) {
                const sourcePath = path.join(process.cwd(), dir);
                const destPath = path.join(backupPath, dir);

                if (fs.existsSync(sourcePath)) {
                    await this.copyDirectory(sourcePath, destPath);
                    backedUpCount++;
                }
            }

            // Create backup info file
            const backupInfo = {
                timestamp: new Date().toISOString(),
                backupName: backupName,
                directories: dirsToBackup,
                backedUpCount: backedUpCount
            };

            fs.writeFileSync(
                path.join(backupPath, 'backup-info.json'),
                JSON.stringify(backupInfo, null, 2)
            );

            console.log(`✅ Backup created: ${backupName} (${backedUpCount} directories)`);
            return backupName;

        } catch (error) {
            console.error('❌ Backup creation failed:', error.message);
            return null;
        }
    }

    async copyDirectory(source, destination) {
        try {
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            const items = fs.readdirSync(source);

            for (const item of items) {
                const sourcePath = path.join(source, item);
                const destPath = path.join(destination, item);
                const stat = fs.statSync(sourcePath);

                if (stat.isDirectory()) {
                    await this.copyDirectory(sourcePath, destPath);
                } else {
                    fs.copyFileSync(sourcePath, destPath);
                }
            }
        } catch (error) {
            console.error(`❌ Failed to copy directory ${source}:`, error.message);
        }
    }

    async restoreBackup(backupName) {
        try {
            const backupPath = path.join(this.backupDir, backupName);

            if (!fs.existsSync(backupPath)) {
                console.log(`❌ Backup not found: ${backupName}`);
                return false;
            }

            console.log(`🔄 Restoring backup: ${backupName}`);

            // Read backup info
            const infoPath = path.join(backupPath, 'backup-info.json');
            let backupInfo = {};
            if (fs.existsSync(infoPath)) {
                backupInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
            }

            // Restore directories
            const dirsToRestore = backupInfo.directories || [
                'store',
                'library/database',
                'message_data',
                'trash_baileys',
                'zetechplugs'
            ];

            let restoredCount = 0;
            for (const dir of dirsToRestore) {
                const sourcePath = path.join(backupPath, dir);
                const destPath = path.join(process.cwd(), dir);

                if (fs.existsSync(sourcePath)) {
                    // Remove existing directory if it exists
                    if (fs.existsSync(destPath)) {
                        fs.rmSync(destPath, { recursive: true, force: true });
                    }

                    await this.copyDirectory(sourcePath, destPath);
                    restoredCount++;
                }
            }

            console.log(`✅ Backup restored: ${backupName} (${restoredCount} directories)`);
            return true;

        } catch (error) {
            console.error(`❌ Backup restore failed:`, error.message);
            return false;
        }
    }

    async listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) {
                return [];
            }

            const backups = fs.readdirSync(this.backupDir)
                .filter(item => {
                    const itemPath = path.join(this.backupDir, item);
                    return fs.statSync(itemPath).isDirectory() && item.startsWith('backup-');
                })
                .sort()
                .reverse(); // Most recent first

            return backups;

        } catch (error) {
            console.error('❌ Failed to list backups:', error.message);
            return [];
        }
    }

    async cleanOldBackups() {
        try {
            const backups = await this.listBackups();

            if (backups.length > this.config.maxBackups) {
                const backupsToDelete = backups.slice(this.config.maxBackups);
                
                for (const backup of backupsToDelete) {
                    const backupPath = path.join(this.backupDir, backup);
                    fs.rmSync(backupPath, { recursive: true, force: true });
                    console.log(`🗑️ Deleted old backup: ${backup}`);
                }
            }

        } catch (error) {
            console.error('❌ Failed to clean old backups:', error.message);
        }
    }

    async uploadFile(localPath, cloudPath) {
        // For local backup, we just create a backup
        return await this.createBackup();
    }

    async downloadFile(cloudPath, localPath) {
        // For local backup, we restore from the latest backup
        const backups = await this.listBackups();
        if (backups.length === 0) {
            console.log('❌ No backups available to restore from');
            return false;
        }

        const latestBackup = backups[0];
        return await this.restoreBackup(latestBackup);
    }

    async listCloudFiles() {
        // Return list of available backups
        return await this.listBackups();
    }

    async fileExistsInCloud(fileName) {
        // For local backup, we check if any backup exists
        const backups = await this.listBackups();
        return backups.length > 0;
    }

    async syncDatabase() {
        return await this.createBackup();
    }

    async loadDatabase() {
        const backups = await this.listBackups();
        if (backups.length === 0) {
            console.log('ℹ️ No backups available to restore from');
            return false;
        }

        const latestBackup = backups[0];
        return await this.restoreBackup(latestBackup);
    }

    async syncSession(sessionId) {
        return await this.createBackup();
    }

    async loadSession(sessionId) {
        const backups = await this.listBackups();
        if (backups.length === 0) {
            console.log('ℹ️ No backups available to restore from');
            return false;
        }

        const latestBackup = backups[0];
        return await this.restoreBackup(latestBackup);
    }

    async disconnect() {
        console.log('✅ Local backup system disconnected');
    }
}

module.exports = LocalBackup;
