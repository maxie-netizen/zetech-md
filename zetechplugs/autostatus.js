const fs = require('fs');
const path = require('path');

// Path to store auto status configuration
const configPath = path.join(__dirname, '../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
}
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false }));
}

let trashplug = async (m, { conn, reply, trashown, reaction }) => {
    // React to the autostatus message
    try {
        await reaction(m.chat, "📱");
    } catch (error) {
        console.log('Failed to react to autostatus message:', error.message);
    }

    // Check if sender is owner
    if (!trashown) {
        return reply('❌ This command can only be used by the owner!');
    }

    try {
        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!m.text || m.text.split(' ').length < 2) {
            const status = config.enabled ? 'enabled' : 'disabled';
            return reply(`🔄 *Auto Status View*\n\nCurrent status: ${status}\n\nUse:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view`);
        }

        // Handle on/off commands
        const args = m.text.split(' ').slice(1);
        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            return reply('✅ Auto status view has been enabled!\nBot will now automatically view all contact statuses.');
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            return reply('❌ Auto status view has been disabled!\nBot will no longer automatically view statuses.');
        } else {
            return reply('❌ Invalid command! Use:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view');
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        return reply('❌ Error occurred while managing auto status!\n' + error.message);
    }
};

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to handle status updates
async function handleStatusUpdate(conn, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await conn.readMessages([msg.key]);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    console.log(`✅ Status Viewed from: ${sender.split('@')[0]}`);
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        console.log('⚠️ Rate limit hit, waiting before retrying...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await conn.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await conn.readMessages([status.key]);
                const sender = status.key.participant || status.key.remoteJid;
                console.log(`✅ Viewed status from: ${sender.split('@')[0]}`);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await conn.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await conn.readMessages([status.reaction.key]);
                const sender = status.reaction.key.participant || status.reaction.key.remoteJid;
                console.log(`✅ Viewed status from: ${sender.split('@')[0]}`);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, waiting before retrying...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await conn.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

trashplug.help = ['autostatus']
trashplug.tags = ['autostatus']
trashplug.command = ['autostatus']

module.exports = trashplug;

// Export the handler function for use in main handler
module.exports.handleStatusUpdate = handleStatusUpdate;
module.exports.isAutoStatusEnabled = isAutoStatusEnabled;
