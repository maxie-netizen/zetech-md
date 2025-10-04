# `/delsession` Command Fix

## ✅ **Problem Identified**

The `/delsession` command was not properly removing sessions from the bot's memory, causing:
- Sessions to still appear in `/status` after deletion
- Inconsistent behavior between session files and active connections
- Users unable to properly disconnect sessions

## 🔧 **Root Cause**

The original `/delsession` command only:
1. ✅ Deleted session files (if directory existed)
2. ❌ Did NOT disconnect WhatsApp connections
3. ❌ Did NOT remove from `global.activeConnections`
4. ❌ Only removed from `connectedUsers` if session directory existed

## 🛠️ **Fixes Applied**

### **1. Enhanced `/delsession` Command**
Now properly handles all scenarios:

```javascript
// Check if phone number is actually connected
const isConnected = global.activeConnections.has(phoneNumber);
const isInConnectedUsers = connectedUsers[chatId] && connectedUsers[chatId].some(user => user.phoneNumber === phoneNumber);

if (isConnected || isInConnectedUsers) {
    // 1. Disconnect WhatsApp connection
    if (isConnected) {
        await conn.logout();
        global.activeConnections.delete(phoneNumber);
    }
    
    // 2. Remove from connected users
    connectedUsers[chatId] = connectedUsers[chatId].filter(user => user.phoneNumber !== phoneNumber);
    saveConnectedUsers();
    
    // 3. Delete session files
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
}
```

### **2. Improved `/status` Command**
Now shows accurate connection status:

```javascript
connectedUser.forEach(user => {
    const isActive = global.activeConnections.has(user.phoneNumber);
    const status = isActive ? '🟢 Active' : '🔴 Disconnected';
    statusText += `📱 ${user.phoneNumber} (Uptime: ${uptime}s) ${status}\n`;
});
```

## ✅ **New Behavior**

### **Before (Broken):**
```
User: /delsession 254740300165
Bot: ❌ No session found for 254740300165. It may have already been deleted.
User: /status  
Bot: 📱 254740300165 (Uptime: 77931 seconds)  ← Still shows as connected!
```

### **After (Fixed):**
```
User: /delsession 254740300165
Bot: 🗑️ Session for 254740300165 has been deleted.
     ✅ WhatsApp connection disconnected
     ✅ Session files removed
     ✅ You can now request a new pairing code.
User: /status
Bot: 📱 254740300165 (Uptime: 77931s) 🔴 Disconnected  ← Shows as disconnected!
```

## 🔍 **What the Fix Does**

1. **✅ Disconnects WhatsApp**: Properly logs out the WhatsApp connection
2. **✅ Removes from Memory**: Deletes from `global.activeConnections`
3. **✅ Updates User List**: Removes from `connectedUsers[chatId]`
4. **✅ Deletes Files**: Removes session directory and files
5. **✅ Shows Status**: `/status` now shows 🟢 Active or 🔴 Disconnected
6. **✅ Handles Edge Cases**: Works even if session files don't exist

## 🧪 **Testing**

1. **Connect a session**: `/connect 254740300165 your_api_key`
2. **Check status**: `/status` → Should show 🟢 Active
3. **Delete session**: `/delsession 254740300165`
4. **Check status again**: `/status` → Should show 🔴 Disconnected or not show at all

The `/delsession` command now works correctly and sessions are properly removed from all tracking systems!
