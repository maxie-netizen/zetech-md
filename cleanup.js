#!/usr/bin/env node

/**
 * Cleanup script for Zetech-MD Bot
 * This script helps clean up lock files and stop existing processes
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const lockFile = path.join(__dirname, '.bot.lock');

console.log('🧹 Zetech-MD Bot Cleanup Script');
console.log('================================');

// Function to remove lock file
function removeLockFile() {
    try {
        if (fs.existsSync(lockFile)) {
            const lockData = fs.readFileSync(lockFile, 'utf8');
            const lockInfo = JSON.parse(lockData);
            
            console.log(`📋 Found lock file:`);
            console.log(`   • Process ID: ${lockInfo.pid}`);
            console.log(`   • Created: ${new Date(lockInfo.timestamp).toLocaleString()}`);
            console.log(`   • Start Time: ${lockInfo.startTime}`);
            
            fs.unlinkSync(lockFile);
            console.log('✅ Lock file removed successfully');
            return true;
        } else {
            console.log('ℹ️ No lock file found');
            return false;
        }
    } catch (error) {
        console.error('❌ Error removing lock file:', error.message);
        return false;
    }
}

// Function to kill existing Node.js processes (be careful with this)
function killNodeProcesses() {
    return new Promise((resolve) => {
        console.log('🔍 Checking for existing Node.js processes...');
        
        exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
            if (error) {
                console.log('ℹ️ No Node.js processes found or error checking processes');
                resolve(false);
                return;
            }
            
            const lines = stdout.split('\n').filter(line => line.includes('node.exe'));
            if (lines.length > 1) { // More than just the header
                console.log(`📊 Found ${lines.length - 1} Node.js process(es) running`);
                console.log('🔄 Attempting to stop bot processes...');
                
                // Try to stop Node.js processes that might be bot instances
                exec('taskkill /F /IM node.exe', (killError, killStdout, killStderr) => {
                    if (killError) {
                        console.log('⚠️ Could not stop all Node.js processes');
                        console.log('💡 You may need to manually stop them using Task Manager');
                    } else {
                        console.log('✅ Node.js processes stopped');
                    }
                    resolve(true);
                });
            } else {
                console.log('ℹ️ No additional Node.js processes found');
                resolve(true);
            }
        });
    });
}

// Function to check for Telegram bot conflicts
function checkTelegramConflicts() {
    console.log('🔍 Checking for potential Telegram bot conflicts...');
    console.log('💡 If you see "409 Conflict" errors, it means multiple bot instances are running');
    console.log('💡 Make sure to stop all bot instances before starting a new one');
}

// Main cleanup function
async function cleanup() {
    console.log('\n🚀 Starting cleanup process...\n');
    
    // Remove lock file
    const lockRemoved = removeLockFile();
    
    // Check for Node.js processes
    await killNodeProcesses();
    
    // Check for Telegram conflicts
    checkTelegramConflicts();
    
    console.log('\n✅ Cleanup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure no other bot instances are running');
    console.log('2. Start the bot with: npm start or node index.js');
    console.log('3. If you still get conflicts, restart your computer');
    
    if (lockRemoved) {
        console.log('\n🎉 Lock file was removed - you can now start the bot safely');
    }
}

// Run cleanup
cleanup().catch(error => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
});
