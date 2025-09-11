const axios = require('axios');
let trashplug = async (m, { reply,text,conn,participants,isAdmins,}) => {
if (!m.isGroup) return reply(mess.group)
if (!isAdmins) return reply("this feature is only for group admins")

const responseList = await conn.groupRequestParticipantsList(m.chat);

if (responseList.length === 0) return reply("no pending requests detected at the moment!");

for (const participan of responseList) {
    const response = await conn.groupRequestParticipantsUpdate(
        m.chat, 
        [participan.jid], // Approve/reject each participant individually
        "approve" // or "reject"
    );
    console.log(response);
}
reply("TRASHCORE BOT has approved all pending requests✅");

             } ;

trashplug.help = ['approve']
trashplug.tags = ['approve-all']
trashplug.command = ['approve']


module.exports = trashplug;
