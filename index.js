require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

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

// 1. 명령어 로딩 (기존 형식 100% 유지)
const loadCommands = () => {
    const folders = ['commands', 'dev-commands']; 
    for (const folder of folders) {
        const commandsPath = path.join(__dirname, folder);
        if (!fs.existsSync(commandsPath)) continue; 
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(__dirname, folder, file);
            delete require.cache[require.resolve(filePath)]; 
            const command = require(filePath);
            
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            } else if (command.name && command.execute) {
                client.prefixCommands.set(command.name, command);
            }
        }
    }
};
loadCommands();

// 2. 이벤트 로딩 (새롭게 추가된 자동 이벤트 등록기)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

client.login(process.env.TOKEN);