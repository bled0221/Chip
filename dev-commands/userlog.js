const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!유저로그',
    developerOnly: true, // 오직 개발자님만 실행 가능!
    async execute(message) {
        const args = message.content.split(' ');
        const targetUserId = args[1];

        // 유저 ID를 입력하지 않았을 때 사용법 안내
        if (!targetUserId) return message.reply('❌ 사용법: `!유저로그 유저ID`');

        try {
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            const data = fs.readFileSync('command-logs.txt', 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '');
            
            // 💡 1. 전체 로그 중 "유저ID: 입력한ID"가 포함된 라인만 필터링한 후, 최신순(.reverse()) 정렬
            const logs = lines.filter(line => line.includes(`유저ID: ${targetUserId}`)).reverse();

            if (logs.length === 0) {
                return message.reply(`📭 해당 유저 ID(<@${targetUserId}>)에 대한 기록을 찾을 수 없습니다.`);
            }

            const pageSize = 5;
            let page = 0;
            const totalPages = Math.ceil(logs.length / pageSize);

            const generateEmbed = (pageIndex) => {
                const start = pageIndex * pageSize;
                const end = start + pageSize;
                
                const pageLogs = logs.slice(start, end).map(line => {
                    // 유저 ID 부분을 멘션 형태로 변환해서 보기 편하게 만듭니다.
                    return line.replace(/유저ID: (\d+)/g, (match, userId) => `유저ID: <@${userId}>`);
                }).join('\n');

                return new EmbedBuilder()
                    .setTitle(`👤 유저 로그 - <@${targetUserId}> (${pageIndex + 1}/${totalPages})`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x00aaff); // 서버 로그와 구분하기 위해 파란색 계열로 설정
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