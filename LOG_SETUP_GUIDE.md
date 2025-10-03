# 📊 Log Collector Setup Guide

## Overview
The bot now includes an automated log collection system that captures all terminal messages and sends them to a Telegram group as a .txt file every 30 minutes.

## 🚀 Features
- **Automatic Log Capture**: Captures all console.log, console.error, console.warn, and console.info messages
- **Scheduled Sending**: Automatically sends logs to Telegram group every 30 minutes
- **File Management**: Creates timestamped .txt files and cleans up old files
- **Memory Management**: Keeps only the last 10,000 log entries in memory
- **Error Handling**: Graceful handling of Telegram API errors

## 🔧 Setup Instructions

### Step 1: Create a Telegram Bot for Logs
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Choose a name for your log bot (e.g., "My Bot Logs")
4. Choose a username (e.g., "my_bot_logs_bot")
5. Copy the bot token you receive

### Step 2: Create a Telegram Group for Logs
1. Create a new Telegram group
2. Add your log bot to the group
3. Make the bot an admin (optional but recommended)
4. Get the group ID:
   - Add `@userinfobot` to your group
   - Send any message
   - Copy the group ID (it's a negative number like `-1001234567890`)

### Step 3: Configure the Bot
1. Open `config.json` in your bot directory
2. Replace `YOUR_LOG_BOT_TOKEN_HERE` with your bot token
3. Replace `YOUR_LOG_GROUP_ID_HERE` with your group ID
4. Set `LOG_MIN` to your desired interval in minutes (default: 30)

Example:
```json
{
  "prefix": ".",
  "public": false,
  "BotName": "Zetech-MD",
  "BOT_TOKEN": "8255950384:AAENquLbbAT7ayE8RqQhzHPJQGTyNO2VRcc",
  "OWNER_ID": "7802048260",
  "LOG_BOT_TOKEN": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
  "LOG_GROUP_ID": "-1001234567890",
  "LOG_MIN": "30"
}
```

## 📁 File Structure
```
maxie-md/
├── library/lib/
│   └── logCollector.js          # Log collector system
├── logs/                         # Generated log files
│   ├── bot-logs-2024-01-01T12-00-00-000Z.txt
│   └── bot-logs-2024-01-01T12-30-00-000Z.txt
└── config.json                   # Configuration file
```

## 🔄 How It Works

### Log Collection
- All console messages are automatically captured
- Each log entry includes timestamp, level, and message
- Logs are stored in memory (max 10,000 entries)

### Scheduled Sending
- Every 30 minutes, logs are compiled into a .txt file
- File is sent to the configured Telegram group
- Old log files are automatically cleaned up (keeps last 5 files)

### Log Format
```
[2024-01-01T12:00:00.000Z] [LOG] 🚀 Starting ZETECH-MD Bot...
[2024-01-01T12:00:01.000Z] [ERROR] ❌ Failed to initialize cloud storage
[2024-01-01T12:00:02.000Z] [INFO] ✅ Cloud storage ready, loading sessions...
```

## 🛠️ Manual Commands

### Send Logs Immediately
```javascript
// In your bot code, you can manually trigger log sending
await global.logCollector.sendLogsToTelegram();
```

### Get Log Statistics
```javascript
// Check log collector status
const stats = global.logCollector.getStats();
console.log(stats);
```

## ⚙️ Configuration Options

### Change Sending Interval
You can easily change the log sending interval by modifying the `LOG_MIN` value in `config.json`:

```json
{
  "LOG_MIN": "15"    // Send logs every 15 minutes
  "LOG_MIN": "60"    // Send logs every 60 minutes (1 hour)
  "LOG_MIN": "120"   // Send logs every 120 minutes (2 hours)
  "LOG_MIN": "5"     // Send logs every 5 minutes (for testing)
}
```

**Common Intervals:**
- `"5"` - Every 5 minutes (for testing)
- `"15"` - Every 15 minutes (frequent monitoring)
- `"30"` - Every 30 minutes (default)
- `"60"` - Every hour
- `"120"` - Every 2 hours
- `"480"` - Every 8 hours
- `"1440"` - Every 24 hours (daily)

### Adjust Memory Limit
To change the maximum number of logs kept in memory, modify `logCollector.js`:
```javascript
this.maxLogs = 20000; // Keep 20,000 logs instead of 10,000
```

## 🚨 Troubleshooting

### Bot Not Sending Logs
1. Check if `LOG_BOT_TOKEN` and `LOG_GROUP_ID` are correctly set in `config.json`
2. Ensure the bot is added to the group and has permission to send messages
3. Check console for error messages

### Group ID Issues
- Group IDs are negative numbers (e.g., `-1001234567890`)
- Make sure you're using the group ID, not the group username
- The bot must be added to the group first

### File Permission Issues
- Ensure the bot has write permissions to the `logs/` directory
- Check if the directory exists and is accessible

## 📊 Log File Information
- **File Name Format**: `bot-logs-YYYY-MM-DDTHH-mm-ss-sssZ.txt`
- **File Location**: `maxie-md/logs/`
- **Retention**: Last 5 files are kept, older ones are automatically deleted
- **File Size**: Varies based on activity (typically 1-10 MB per file)

## 🔒 Security Notes
- Log files may contain sensitive information
- Ensure your Telegram group is private
- Consider encrypting log files if they contain sensitive data
- Regularly review and clean up old log files

## 📈 Monitoring
The log collector provides real-time statistics:
- Total number of logs captured
- Initialization status
- Telegram bot connection status
- Group ID configuration

## 🎯 Benefits
- **Automated Monitoring**: No manual intervention required
- **Historical Records**: Keep track of bot performance over time
- **Remote Access**: Access logs from anywhere via Telegram
- **Error Tracking**: Easily identify and debug issues
- **Performance Analysis**: Monitor bot activity patterns

---

**Note**: The log collector starts automatically when the bot starts. Make sure to configure the Telegram credentials before running the bot for the first time.
