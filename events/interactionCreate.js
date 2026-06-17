const fs = require('node:fs');
const path = require('node:path');

// 기존 로그 저장 함수 형식 유지
function saveLog(guildId, userId, fullCommand) {
    const logFilePath = path.join(__dirname, '..', 'command-logs.txt'); // 한 단계 상위 폴더의 로그파일 지정
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] 서버ID: ${guildId} | 유저ID: ${userId} | 명령어: ${fullCommand}\n`;
    
    try {
        fs.appendFileSync(logFilePath, logEntry);
        console.log(`[로그 저장] ${fullCommand}`);
    } catch (err) {
        console.error("❌ 로그 저장 실패:", err);
    }
}

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;
        
        // client 객체는 interaction.client로 접근 가능합니다.
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        const options = interaction.options.data.map(o => o.value).join(' ');
        const fullCommand = `/${interaction.commandName}${options ? ' ' + options : ''}`;

        saveLog(interaction.guild.id, interaction.user.id, fullCommand);

        try { 
            await command.execute(interaction); 
        } catch (error) { 
            console.error(error); 
        }
    }
};