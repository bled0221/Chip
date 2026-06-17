module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot || !message.content.startsWith('!')) return;

        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args[0]; 
        
        // client 객체는 message.client로 접근 가능합니다.
        const command = message.client.prefixCommands.get(`!${commandName}`);

        if (command && command.developerOnly && message.author.id === process.env.DEVELOPER_ID) {
            try {
                await command.execute(message);
            } catch (error) {
                console.error(error);
            }
        }
    }
};