const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true, // 한번만 실행되는 이벤트
    execute(c) {
        console.log(`✅ ${c.user.tag} 봇이 성공적으로 실행되었습니다!`);
    }
};