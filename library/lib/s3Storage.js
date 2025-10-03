const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class S3Storage {
    constructor() {
        this.s3 = null;
        this.isConnected = false;
        this.bucketName = 'zetech-md-bot-data';
        this.config = {
            // AWS credentials - you can set these via environment variables
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY',
            region: process.env.AWS_REGION || 'us-east-1'
        };
    }

    async initialize() {
        try {
            console.log('🔄 Initializing AWS S3 storage...');
            
            // Check if credentials are provided
            if (this.config.accessKeyId === 'YOUR_ACCESS_KEY' || this.config.secretAccessKey === 'YOUR_SECRET_KEY') {
                console.log('⚠️ AWS credentials not configured');
                console.log('💡 Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
                console.log('💡 Or update the config in s3Storage.js');
                return false;
            }

            // Configure AWS
            AWS.config.update({
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey,
                region: this.config.region
            });

            this.s3 = new AWS.S3();

            // Test connection by checking if bucket exists
            try {
                await this.s3.headBucket({ Bucket: this.bucketName }).promise();
                console.log(`✅ Connected to S3 bucket: ${this.bucketName}`);
                this.isConnected = true;
                return true;
            } catch (error) {
                if (error.statusCode === 404) {
                    console.log(`📦 Creating S3 bucket: ${this.bucketName}`);
                    await this.s3.createBucket({ Bucket: this.bucketName }).promise();
                    console.log(`✅ S3 bucket created: ${this.bucketName}`);
                    this.isConnected = true;
                    return true;
                } else {
                    throw error;
                }
            }

        } catch (error) {
            console.error('❌ Failed to connect to AWS S3:', error.message);
            return false;
        }
    }

    async uploadFile(localPath, cloudPath) {
        try {
            if (!this.isConnected) {
                console.log('❌ Not connected to S3');
                return false;
            }

            if (!fs.existsSync(localPath)) {
                console.log(`❌ Local file not found: ${localPath}`);
                return false;
            }

            const fileContent = fs.readFileSync(localPath);
            const fileName = path.basename(cloudPath);

            // Check if file already exists
            try {
                await this.s3.headObject({
                    Bucket: this.bucketName,
                    Key: fileName
                }).promise();
                console.log(`ℹ️ File already exists in S3: ${fileName}`);
                return true;
            } catch (error) {
                if (error.statusCode !== 404) {
                    throw error;
                }
            }

            // Upload file
            const uploadParams = {
                Bucket: this.bucketName,
                Key: fileName,
                Body: fileContent,
                ContentType: 'application/json'
            };

            await this.s3.upload(uploadParams).promise();
            console.log(`✅ Uploaded: ${localPath} → ${fileName}`);
            return true;

        } catch (error) {
            console.error(`❌ Upload failed for ${localPath}:`, error.message);
            return false;
        }
    }

    async downloadFile(cloudPath, localPath) {
        try {
            if (!this.isConnected) {
                console.log('❌ Not connected to S3');
                return false;
            }

            const fileName = path.basename(cloudPath);

            // Check if file exists
            try {
                await this.s3.headObject({
                    Bucket: this.bucketName,
                    Key: fileName
                }).promise();
            } catch (error) {
                if (error.statusCode === 404) {
                    console.log(`ℹ️ File not found in S3: ${fileName}`);
                    return false;
                }
                throw error;
            }

            // Download file
            const downloadParams = {
                Bucket: this.bucketName,
                Key: fileName
            };

            const result = await this.s3.getObject(downloadParams).promise();
            
            // Ensure directory exists
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(localPath, result.Body);
            console.log(`✅ Downloaded: ${fileName} → ${localPath}`);
            return true;

        } catch (error) {
            console.error(`❌ Download failed for ${cloudPath}:`, error.message);
            return false;
        }
    }

    async listCloudFiles() {
        try {
            if (!this.isConnected) {
                console.log('❌ Not connected to S3');
                return [];
            }

            const params = {
                Bucket: this.bucketName
            };

            const result = await this.s3.listObjectsV2(params).promise();
            return result.Contents ? result.Contents.map(item => item.Key) : [];

        } catch (error) {
            console.error('❌ Failed to list S3 files:', error.message);
            return [];
        }
    }

    async fileExistsInCloud(fileName) {
        try {
            if (!this.isConnected) {
                return false;
            }

            await this.s3.headObject({
                Bucket: this.bucketName,
                Key: fileName
            }).promise();
            return true;

        } catch (error) {
            if (error.statusCode === 404) {
                return false;
            }
            console.error(`❌ Failed to check if file exists: ${fileName}`, error.message);
            return false;
        }
    }

    async syncDatabase() {
        try {
            console.log('🔄 Syncing database to S3...');
            
            // Find all JSON files
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
                        jsonFiles.push(...await this.findJsonFiles(fullPath));
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
            console.log('📥 Loading database from S3...');
            
            const cloudFiles = await this.listCloudFiles();
            let loadedCount = 0;
            let skippedCount = 0;
            
            for (const cloudFile of cloudFiles) {
                if (cloudFile.endsWith('.json')) {
                    const localPath = path.join(process.cwd(), cloudFile);
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

    async syncSession(sessionId) {
        try {
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);

            if (!fs.existsSync(localSessionDir)) {
                console.log(`❌ Session directory not found: ${sessionPath}`);
                return false;
            }

            // Find all JSON files in session
            const jsonFiles = await this.findJsonFiles(localSessionDir);
            let syncedCount = 0;

            for (const jsonFile of jsonFiles) {
                const relativePath = path.relative(process.cwd(), jsonFile);
                const result = await this.uploadFile(jsonFile, relativePath);
                if (result) {
                    syncedCount++;
                }
            }

            console.log(`✅ Synced ${syncedCount} session files for ${sessionId}`);
            return true;

        } catch (error) {
            console.error(`❌ Session sync failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    async loadSession(sessionId) {
        try {
            const sessionPath = `trash_baileys/session_${sessionId}`;
            const localSessionDir = path.join(process.cwd(), sessionPath);

            // List files with session prefix
            const cloudFiles = await this.listCloudFiles();
            const sessionFiles = cloudFiles.filter(file => file.startsWith(sessionPath));

            if (sessionFiles.length === 0) {
                console.log(`ℹ️ No session files found in S3 for ${sessionId}`);
                return false;
            }

            // Ensure local session directory exists
            if (!fs.existsSync(localSessionDir)) {
                fs.mkdirSync(localSessionDir, { recursive: true });
            }

            // Download session files
            let loadedCount = 0;
            for (const sessionFile of sessionFiles) {
                const localPath = path.join(process.cwd(), sessionFile);
                const result = await this.downloadFile(sessionFile, localPath);
                if (result) {
                    loadedCount++;
                }
            }

            console.log(`✅ Loaded ${loadedCount} session files for ${sessionId}`);
            return true;

        } catch (error) {
            console.error(`❌ Session load failed for ${sessionId}:`, error.message);
            return false;
        }
    }

    async disconnect() {
        try {
            this.isConnected = false;
            this.s3 = null;
            console.log('✅ Disconnected from AWS S3');
        } catch (error) {
            console.error('❌ Error disconnecting from S3:', error.message);
        }
    }
}

module.exports = S3Storage;
