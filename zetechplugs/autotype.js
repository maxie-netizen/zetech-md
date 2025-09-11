const axios = require('axios');
let trashplug = async (m, {command, prefix,q,trashown,reply,text,args }) => {
                if (!trashown) return reply(mess.owner)
                if (args.length < 1) return reply(`Example ${prefix + command} on/off`)
                if (q === 'on') {
                    autoTyping = true
                                        reply(`Autotyping presence is now set to ${q}`)
                } else if (q === 'off') {
                    autoTyping = false
                    reply(`Autotyping presence is now set to ${q}`)
                    }
                };
    
trashplug.help = ['autotypes']
trashplug.tags = ['autotyping']
trashplug.command = ['autotype']


module.exports = trashplug;