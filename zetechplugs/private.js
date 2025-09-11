const axios = require("axios");
 
let trashplug = async (m, { trashown,reply,conn }) => {
                if (!trashown) return reply(mess.owner)
                conn.public = false
                reply('*Successful in Changing To Self Usage*')
            };
            
trashplug.help = ['self']
trashplug.tags = ['private']
trashplug.command = ['private']
 
module.exports = trashplug;