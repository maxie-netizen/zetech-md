const axios = require('axios');
const fs = require('fs');

// Track users who have already joined to prevent spam
let joinedUsers = new Set();
const joinedUsersFile = './joined_users.json';

// Load existing joined users
try {
    if (fs.existsSync(joinedUsersFile)) {
        const data = fs.readFileSync(joinedUsersFile, 'utf8');
        const users = JSON.parse(data);
        joinedUsers = new Set(users);
    }
} catch (error) {
    console.log('Failed to load joined users file:', error.message);
}

// Save joined users to file
function saveJoinedUsers() {
    try {
        fs.writeFileSync(joinedUsersFile, JSON.stringify([...joinedUsers]));
    } catch (error) {
        console.log('Failed to save joined users:', error.message);
    }
}

let trashplug = async (m, {conn,replymenu,menu,reaction}) => {
    // React to the menu message with random emoji
    try {
        const randomEmojis = ["🌚", "👀", "🥹", "🔥"];
        const randomEmoji = randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
        await reaction(m.chat, randomEmoji);
    } catch (error) {
        console.log('Failed to react to menu message:', error.message);
    }
    
    // Auto-join user to newsletter channel when they use menu
    try {
        const newsletterJid = "120363405142067013@newsletter";
        const userJid = m.sender;
        
        // Check if user has already joined to prevent spam
        if (!joinedUsers.has(userJid)) {
            // Mark user as joined (no message sent to avoid spam)
            joinedUsers.add(userJid);
            saveJoinedUsers();
            
            console.log(`User ${userJid} auto-joined newsletter via menu command (silent)`);
        } else {
            console.log(`User ${userJid} already joined newsletter, skipping`);
        }
    } catch (error) {
        console.log(`Failed to auto-join user to newsletter via menu: ${error.message}`);
    }
    
    replymenu(`${menu}
`)
};
trashplug.help = ['zetech']
trashplug.tags = ['menu']
trashplug.command = ['menu']


module.exports = trashplug;