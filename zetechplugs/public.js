const axios = require("axios");
 
let trashplug = async (m, { trashown,reply,conn }) => {
                if (!trashown) return reply(mess.owner)
                conn.private = false
                reply('*Successful in Changing To Self Usage*')
            };
            
trashplug.help = ['public']
trashplug.tags = ['public']
trashplug.command = ['public']
 
module.exports = trashplug;