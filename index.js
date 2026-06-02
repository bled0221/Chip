require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// 💡 느낌표 명령어를 위해 GuildMessages와 MessageContent 권한을 추가했어!
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

// 슬래시용 바구니와 느낌표용 바구니를 따로 만들었어
client.commands = new Collection();
client.prefixCommands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // 1. 슬래시 명령어 등록 (기존 방식)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } 
    // 2. 느낌표 명령어 등록 ('dev-'로 시작하는 파일만)
    else if ('name' in command && 'execute' in command && file.startsWith('dev-')) {
        client.prefixCommands.set(command.name, command);
    } 
    else {
        console.log(`[⚠️ 경고] ${filePath} 파일의 형식을 확인해주세요.`);
    }
}

client.once('ready', () => {
    console.log('✅ 모든 명령어가 성공적으로 장착되었습니다!');
    console.log(`🤖 ${client.user.username} 봇이 성공적으로 실행되었습니다!`);
});

// 슬래시 명령어 처리 (기존 코드)
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const reply = { content: '명령어를 실행하는 중 오류가 발생했습니다!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

// 느낌표 명령어 처리 (새로 추가)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // 명령어(예: !서버목록)를 찾아서 실행
    const command = client.prefixCommands.get(message.content.trim());
    if (command) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.TOKEN);