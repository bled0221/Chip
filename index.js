require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

client.commands = new Collection();
client.prefixCommands = new Collection();

// 1. 명령어 폴더 로딩 (commands, dev-commands)
const folders = ['commands', 'dev-commands']; 
for (const folder of folders) {
    const commandsPath = path.join(__dirname, folder);
    if (!fs.existsSync(commandsPath)) continue; 

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(__dirname, folder, file); // 수정: 정확한 경로 지정
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else if ('name' in command && 'execute' in command) {
            client.prefixCommands.set(command.name, command);
        }
    }
}

// 2. 명령어 사용 로그 저장 함수
function saveLog(guildId, userId, commandContent) {
    const timestamp = new Date().toLocaleString();
    // command-logs.txt 파일에 기록
    const logEntry = `[${timestamp}] 서버ID: ${guildId} | 유저ID: ${userId} | 명령어: ${commandContent}\n`;
    fs.appendFileSync('command-logs.txt', logEntry);
}

client.once(Events.ClientReady, (c) => {
    console.log(`✅ ${c.user.username} 봇이 성공적으로 실행되었습니다!`);
});

// 슬래시 명령어 처리
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
    }
});

// 접두사 명령어 처리 (로그 + 무응답 보안 로직)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const command = client.prefixCommands.get(message.content.trim());
    if (command) {
        // [로그 기록] 모든 시도를 기록합니다.
        saveLog(message.guild.id, message.author.id, message.content);

        // [개발자 전용 보안 체크] 내가 아니면 '무응답(return)'
        if (command.developerOnly && message.author.id !== process.env.DEVELOPER_ID) {
            return; 
        }

        // [명령어 실행]
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.TOKEN);