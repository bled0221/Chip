// commands/dev-serverlist.js
module.exports = {
    name: '!서버목록',
    async execute(message) {
        const developerID = process.env.DEVELOPER_ID;

        // 권한 확인 (본인인지)
        if (message.author.id !== developerID) {
            // 너가 아닐 경우 반응하지 않거나, 원한다면 메시지를 보낼 수 있음
            return; 
        }

        // 서버 목록 가져오기
        const guildList = message.client.guilds.cache
            .map(g => `• **${g.name}** (ID: ${g.id})`)
            .join('\n');

        // 메시지를 보낸 채널에 바로 출력
        await message.reply({
            content: `현재 **${message.client.guilds.cache.size}**개의 서버에 참여 중입니다:\n\n${guildList}`
        });
    },
};