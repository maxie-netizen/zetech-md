const axios = require('axios');
let trashplug = async (m, { trashown,text,trashcore,reply,isAdmins,prefix, command }) => {
				if (!m.isGroup) return reply(mess.grouo)
				if (!trashown && !isAdmins) return reply(mess.admin)
				if (!text) return reply(`*Example :* ${prefix + command} target`)
				let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
				if (!m.mentionedJid[0] && !m.quoted && !text) return reply(`*Example :* ${prefix + command} target`)
				await trashcore.groupParticipantsUpdate(m.chat, [users], 'demote').then((res) => reply(mess.succes)).catch((err) => reply(mess.error))
			};
trashplug.help = ['dismiss']
trashplug.tags = ['demote']
trashplug.command = ['demote']


module.exports = trashplug;	

module.exports = trashplug;		