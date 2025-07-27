const axios = require('axios');
let trashplug = async (m, { trashown,text,trashcore,reply,isBotAdmins,isAdmins,prefix,command}) => {
				if (!m.isGroup) return reply(mess.group);
				if (!trashown && !isAdmins) return reply(mess.admin);
			
				if (!m.quoted && !m.mentionedJid[0] && isNaN(parseInt(args[0]))) {
					return reply(`*Example :* ${prefix + command} target`);
				}
				let users = m.mentionedJid[0] 
				? m.mentionedJid[0] 
				: m.quoted 
				? m.quoted.sender 
				: text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
				if (owner.includes(users.replace('@s.whatsapp.net', ''))) {
					return reply('My Owner, Cant Kick Them');
				}
				try {
					await trashcore.groupParticipantsUpdate(m.chat, [users], 'remove');
					reply(mess.succes);
				} catch (err) {
					console.error(err);
					reply(mess.error);
				}
			};
trashplug.help = ['kik']
trashplug.tags = ['kick']
trashplug.command = ['remove']


module.exports = trashplug;		
			