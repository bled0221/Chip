require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js'); // Events 추가

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

client.commands = new Collection();
client.prefixCommands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } 
    else if ('name' in command && 'execute' in command && file.startsWith('dev-')) {
        client.prefixCommands.set(command.name, command);
    } 
    else {
        console.log(`[⚠️ 경고] ${filePath} 파일의 형식을 확인해주세요.`);
    }
}

// 💡 여기를 수정했어! (Events.ClientReady 사용)
client.once(Events.ClientReady, (c) => {
    console.log('✅ 모든 명령어가 성공적으로 장착되었습니다!');
    console.log(`🤖 ${c.user.username} 봇이 성공적으로 실행되었습니다!`); 
});

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

client.on('messageCreate', async message => {
    if (message.author.bot) return;

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