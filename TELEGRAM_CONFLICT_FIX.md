# Telegram Bot Conflict Fix

## Problem
The error `ETELEGRAM: 409 Conflict: terminated by other getUpdates request; make sure that only one bot instance is running` occurs when multiple Telegram bot instances try to poll the same bot token simultaneously.

## Root Cause
The issue was caused by:
1. Multiple TelegramBot instances being created in the code
2. No process management to prevent multiple instances
3. No proper cleanup mechanisms

## Solution Implemented

### 1. Bot Instance Management
- Added global bot instance tracking
- Implemented singleton pattern for bot initialization
- Added safety checks before bot operations

### 2. Process Lock System
- Created `.bot.lock` file to prevent multiple instances
- Automatic cleanup of stale lock files
- Process ID tracking

### 3. Shared Bot Instance
- Modified logCollector to use the main bot instance
- Eliminated duplicate TelegramBot creation
- Added proper error handling

### 4. Graceful Shutdown
- Added signal handlers for SIGINT, SIGTERM, SIGUSR2
- Proper cleanup of connections and lock files
- Safe bot polling stop

## Usage

### Starting the Bot
```bash
npm start
```

### If You Get Conflicts
1. **Quick Fix (Windows):**
   ```bash
   cleanup.bat
   ```

2. **Manual Cleanup:**
   ```bash
   npm run cleanup
   ```

3. **Clean Start:**
   ```bash
   npm run clean
   ```

### Manual Process Cleanup
If you still get conflicts:
1. Open Task Manager
2. End all `node.exe` processes
3. Delete `.bot.lock` file if it exists
4. Restart the bot

## Files Modified
- `index.js` - Added bot instance management and process locks
- `library/lib/logCollector.js` - Modified to use shared bot instance
- `package.json` - Added cleanup scripts
- `cleanup.js` - Created cleanup utility
- `cleanup.bat` - Windows cleanup script

## Prevention
The bot now automatically:
- Prevents multiple instances from running
- Cleans up stale lock files
- Handles graceful shutdowns
- Uses a single bot instance for all operations

## Testing
After implementing the fix:
1. The bot should start without conflicts
2. No "409 Conflict" errors should appear
3. Multiple startup attempts should be blocked
4. Cleanup should work properly

## Troubleshooting
If you still encounter issues:
1. Restart your computer
2. Check for any remaining Node.js processes
3. Verify only one bot instance is running
4. Use the cleanup scripts provided
