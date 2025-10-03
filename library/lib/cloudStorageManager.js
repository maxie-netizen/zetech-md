const { getCurrentProvider } = require('../../cloudConfig');

class CloudStorageManager {
    constructor() {
        this.provider = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            const providerConfig = getCurrentProvider();
            console.log(`🔄 Initializing ${providerConfig.name}...`);
            
            // Dynamically require the provider module
            const ProviderClass = require(providerConfig.module.replace('./', '../../'));
            this.provider = new ProviderClass();
            
            // Initialize the provider
            const connected = await this.provider.initialize();
            if (!connected) {
                console.log(`❌ Failed to initialize ${providerConfig.name}`);
                return false;
            }
            
            this.isInitialized = true;
            console.log(`✅ ${providerConfig.name} ready`);
            return true;
            
        } catch (error) {
            console.error('❌ Cloud storage initialization failed:', error.message);
            return false;
        }
    }

    async uploadFile(localPath, cloudPath) {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.uploadFile(localPath, cloudPath);
    }

    async downloadFile(cloudPath, localPath) {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.downloadFile(cloudPath, localPath);
    }

    async listCloudFiles() {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return [];
        }
        return await this.provider.listCloudFiles();
    }

    async fileExistsInCloud(fileName) {
        if (!this.isInitialized) {
            return false;
        }
        return await this.provider.fileExistsInCloud(fileName);
    }

    async syncDatabase() {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.syncDatabase();
    }

    async loadDatabase() {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.loadDatabase();
    }

    async syncSession(sessionId) {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.syncSession(sessionId);
    }

    async loadSession(sessionId) {
        if (!this.isInitialized) {
            console.log('❌ Cloud storage not initialized');
            return false;
        }
        return await this.provider.loadSession(sessionId);
    }

    async disconnect() {
        if (this.provider && this.provider.disconnect) {
            await this.provider.disconnect();
        }
        this.isInitialized = false;
        console.log('✅ Cloud storage disconnected');
    }
}

module.exports = CloudStorageManager;
