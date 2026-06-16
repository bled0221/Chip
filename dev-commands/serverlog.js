const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!서버로그',
    developerOnly: true,
    async execute(message) {
        const args = message.content.split(' ');
        
        // ID를 안 적으면 현재 서버 ID를 자동으로 가져옵니다.
        const targetGuildId = args[1] || message.guildId;

        if (!targetGuildId) return message.reply('❌ `!서버로그 서버ID` 형식을 사용해주세요.');

        try {
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            // 봇의 캐시에서 서버를 찾고, 있으면 이름을 가져옵니다.
            const targetGuild = message.client.guilds.cache.get(targetGuildId);
            const guildName = targetGuild ? targetGuild.name : '알 수 없는 서버';

            const data = fs.readFileSync('command-logs.txt', 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '');
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
                    // 💡 요청하신 대로 제목을 "'서버 이름' 서버 로그" 형식으로 변경했습니다.
                    .setTitle(`${guildName} 서버 로그`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x72767d)
                    // 현재 페이지 상태는 헷갈리지 않게 푸터(바닥글)로 옮겼습니다.
                    .setFooter({ text: `페이지: ${pageIndex + 1}/${totalPages} | 서버 ID: ${targetGuildId}` });
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