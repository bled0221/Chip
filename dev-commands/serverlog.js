const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!서버로그',
    developerOnly: true,
    async execute(message) {
        const args = message.content.split(' ');
        const targetGuildId = args[1];

        if (!targetGuildId) return message.reply('❌ 사용법: `!서버로그 서버ID`');

        try {
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            const data = fs.readFileSync('command-logs.txt', 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '');
            
            // 1. 해당 서버의 로그만 필터링한 후, .reverse()를 붙여 최신 로그가 맨 앞으로 오게 합니다.
            const logs = lines.filter(line => line.includes(targetGuildId)).reverse();

            if (logs.length === 0) {
                return message.reply(`📭 해당 서버 ID(${targetGuildId})에 대한 기록을 찾을 수 없습니다.`);
            }

            const pageSize = 5;
            let page = 0;
            const totalPages = Math.ceil(logs.length / pageSize);

            const generateEmbed = (pageIndex) => {
                const start = pageIndex * pageSize;
                const end = start + pageSize;
                
                const pageLogs = logs.slice(start, end).map(line => {
                    return line.replace(/유저ID: (\d+)/g, (match, userId) => `유저ID: <@${userId}>`);
                }).join('\n');

                return new EmbedBuilder()
                    .setTitle(`📜 서버 로그 (${pageIndex + 1}/${totalPages})`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x72767d);
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('이전').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('next').setLabel('다음').setStyle(ButtonStyle.Primary)
            );

            const response = await message.reply({ embeds: [generateEmbed(page)], components: [row] });

            const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) return i.reply({ content: '직접 사용하세요!', ephemeral: true });
                if (i.customId === 'prev') page = page > 0 ? --page : totalPages - 1;
                else page = page < totalPages - 1 ? ++page : 0;
                await i.update({ embeds: [generateEmbed(page)], components: [row] });
            });

        } catch (error) {
            console.error(error);
            message.reply('⚠️ 오류 발생: ' + error.message);
        }
    }
};