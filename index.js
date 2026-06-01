require('dotenv').config(); // 💡 맨 첫 줄에 비밀 서랍(.env)을 여는 코드를 추가했어요!
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 💡 장착된 명령어들을 담아둘 바구니(Collection) 만들기
client.commands = new Collection();

// commands 폴더 안에 있는 모든 .js 파일들을 자동으로 읽어오는 마법의 코드
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // 파일 안에 data와 execute가 잘 들어있는지 확인하고 바구니에 넣기
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[⚠️ 경고] ${filePath} 파일에 data 또는 execute 속성이 누락되었습니다.`);
    }
}

// 💡 네가 말한 대로 터미널 메시지를 더 깔끔하고 전문적이게 고쳤어!
client.once('ready', () => {
    console.log('✅ 모든 명령어가 성공적으로 장착되었습니다!');
    console.log(`🤖 ${client.user.username} 봇이 성공적으로 실행되었습니다!`);
});

// 유저가 슬래시 명령어를 쳤을 때 자동으로 알맞은 파일을 찾아서 실행해 주는 장치
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // 유저가 친 명령어 이름에 맞는 파일을 바구니에서 꺼옴 (예: '청소' -> clean.js 꺼내기)
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`${interaction.commandName} 명령어를 찾을 수 없습니다.`);
        return;
    }

    try {
        // 그 파일 안에 있는 execute(능력)를 실행해!
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '명령어를 실행하는 중 오류가 발생했습니다!', ephemeral: true });
        } else {
            await interaction.reply({ content: '명령어를 실행하는 중 오류가 발생했습니다!', ephemeral: true });
        }
    }
});

// ⭐ 진짜 토큰을 지우고, 비밀 서랍(.env)에서 안전하게 꺼내오도록 수정했어요!
client.login(process.env.TOKEN);