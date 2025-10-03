// Cloud Storage Configuration
// Choose your preferred storage provider

const STORAGE_PROVIDERS = {
    LOCAL: 'local',
    AWS_S3: 'aws_s3',
    GOOGLE_DRIVE: 'google_drive'
};

// Current storage provider (change this to switch providers)
const CURRENT_PROVIDER = STORAGE_PROVIDERS.LOCAL;

// Provider configurations
const PROVIDER_CONFIGS = {
    [STORAGE_PROVIDERS.LOCAL]: {
        name: 'Local Backup',
        description: 'Creates local backups in ./backups directory',
        module: './library/lib/localBackup',
        requiresAuth: false,
        setup: 'No setup required - works out of the box'
    },
    
    [STORAGE_PROVIDERS.AWS_S3]: {
        name: 'AWS S3',
        description: 'Amazon S3 cloud storage',
        module: './library/lib/s3Storage',
        requiresAuth: true,
        setup: 'Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables'
    },
    
    [STORAGE_PROVIDERS.GOOGLE_DRIVE]: {
        name: 'Google Drive',
        description: 'Google Drive cloud storage',
        module: './library/lib/googleDriveStorage',
        requiresAuth: true,
        setup: 'Requires OAuth setup with Google Cloud Console'
    }
};

// Get current provider config
function getCurrentProvider() {
    return PROVIDER_CONFIGS[CURRENT_PROVIDER];
}

// Get all available providers
function getAllProviders() {
    return Object.values(PROVIDER_CONFIGS);
}

// Check if current provider requires authentication
function requiresAuth() {
    return getCurrentProvider().requiresAuth;
}

// Get setup instructions for current provider
function getSetupInstructions() {
    return getCurrentProvider().setup;
}

module.exports = {
    STORAGE_PROVIDERS,
    CURRENT_PROVIDER,
    PROVIDER_CONFIGS,
    getCurrentProvider,
    getAllProviders,
    requiresAuth,
    getSetupInstructions
};