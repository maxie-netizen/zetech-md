const axios = require('axios');
let trashplug = async (m, { text,trashcore,participants,isAdmins,reply }) => {
if (!m.isGroup) return reply(mess.group)
if (!isAdmins) return reply("this feature is only for group admins")
const responseList = await trashcore.groupRequestParticipantsList(m.chat);

if (responseList.length === 0) return reply("no pending requests detected");

for (const participan of responseList) {
    const response = await trashcore.groupRequestParticipantsUpdate(
        m.chat, 
        [participan.jid], // Approve/reject each participant individually
        "reject" // or "reject"
    );
    console.log(response);
}
reply("pending requests have been rejected!");

} ;

trashplug.help = ['reject']
trashplug.tags = ['reject']
trashplug.command = ['reject']


module.exports = trashplug;