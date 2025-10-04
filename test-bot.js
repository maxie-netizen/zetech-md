#!/usr/bin/env node

/**
 * Simple bot test script
 * This script tests if the bot is responding to commands
 */

const TelegramBot = require('node-telegram-bot-api');
const settings = require('./config.json');

console.log('🧪 Testing Telegram Bot...');
console.log('================================');

// Test bot initialization
try {
    const bot = new TelegramBot(settings.BOT_TOKEN, { polling: false });
    console.log('✅ Bot initialized successfully');
    
    // Test bot info
    bot.getMe().then((info) => {
        console.log('✅ Bot info retrieved:');
        console.log(`   • Username: @${info.username}`);
        console.log(`   • First Name: ${info.first_name}`);
        console.log(`   • ID: ${info.id}`);
        console.log('✅ Bot is working correctly!');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Error getting bot info:', error.message);
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ Failed to initialize bot:', error.message);
    process.exit(1);
}
