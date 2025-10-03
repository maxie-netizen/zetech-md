# ☁️ ZETECH-MD Cloud Storage Setup Guide

## Overview
This guide will help you set up cloud storage for your ZETECH-MD bot using Mega.nz. This allows you to host your bot anywhere while maintaining all sessions, premium users, and data.

## 🚀 Quick Setup

### 1. Create Mega.nz Account
- Go to [mega.nz](https://mega.nz)
- Create a free account (50GB free storage)
- Note down your email and password

### 2. Set Environment Variables
Create a `.env` file in your bot directory with:

```env
# Mega.nz credentials
MEGA_EMAIL=your-email@example.com
MEGA_PASSWORD=your-password
MEGA_FOLDER_NAME=ZETECH-MD-Data
```

### 3. Install Dependencies
The required package `megajs` is already installed.

## 📱 Commands

### Cloud Sync Commands
- `.cloudsync` - Show help menu
- `.cloudsync sync` - Sync all data to cloud
- `.cloudsync load` - Load all data from cloud
- `.cloudsync status` - Check connection status
- `.cloudsync force` - Force sync all data
- `.cloudsync start` - Start auto-sync
- `.cloudsync stop` - Stop auto-sync

## 🔄 Auto-Sync Features

### Automatic Sync
- **On Startup**: Loads all data from cloud
- **Every 5 minutes**: Syncs data to cloud
- **On Shutdown**: Final sync to cloud

### What Gets Synced
- ✅ **Sessions**: All WhatsApp sessions
- ✅ **Database**: Premium users, settings, chats
- ✅ **Messages**: Stored message data
- ✅ **Config**: Bot configuration files

## 🛠️ Manual Setup (Alternative)

If you prefer to set credentials in code:

1. Edit `cloudConfig.js`:
```javascript
module.exports = {
    mega: {
        email: 'your-email@example.com',
        password: 'your-password',
        folderName: 'ZETECH-MD-Data'
    }
};
```

## 🔧 Troubleshooting

### Common Issues

1. **"Cloud storage not available"**
   - Check your Mega.nz credentials
   - Ensure internet connection
   - Verify Mega.nz account is active

2. **"Failed to sync data"**
   - Check Mega.nz storage space
   - Verify folder permissions
   - Try manual sync with `.cloudsync force`

3. **"Session not found"**
   - Run `.cloudsync load` to download from cloud
   - Check if session exists in cloud storage

### Debug Mode
Enable debug logging by setting:
```javascript
// In cloudStorage.js
console.log('Debug mode enabled');
```

## 📊 Benefits

### ✅ Advantages
- **Portable**: Host bot anywhere
- **Persistent**: All data preserved
- **Backup**: Automatic cloud backup
- **Sync**: Real-time data synchronization
- **Recovery**: Easy data recovery

### 🔒 Security
- **Encrypted**: Mega.nz uses end-to-end encryption
- **Private**: Only you can access your data
- **Secure**: Credentials stored securely

## 🚀 Usage Examples

### First Time Setup
1. Set up Mega.nz credentials
2. Start your bot
3. Run `.cloudsync sync` to upload existing data
4. Bot will auto-sync from now on

### Moving to New Server
1. Install bot on new server
2. Set same Mega.nz credentials
3. Start bot (auto-loads from cloud)
4. All sessions and data restored!

### Manual Backup
```bash
# Sync everything to cloud
.cloudsync sync

# Load from cloud
.cloudsync load
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify Mega.nz credentials
3. Test with `.cloudsync status`
4. Try manual sync with `.cloudsync force`

---

**Note**: This cloud storage system is designed to work seamlessly with your existing bot setup. All your current data will be preserved and synced to the cloud automatically.
