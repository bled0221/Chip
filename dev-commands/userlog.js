const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!유저로그',
    developerOnly: true, // 오직 개발자님만 실행 가능!
    async execute(message) {
        const args = message.content.split(' ');
        
        // 💡 유저 ID를 안 적으면 현재 명령어를 친 개발자님의 ID(message.author.id)를 자동으로 가져옵니다.
        const targetUserId = args[1] || message.author.id;

        try {
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            // 💡 봇의 캐시에서 유저를 찾고, 있으면 이름(username)을 가져옵니다.
            const targetUser = message.client.users.cache.get(targetUserId);
            const userName = targetUser ? targetUser.username : '알 수 없는 유저';

            const data = fs.readFileSync('command-logs.txt', 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '');
            
            // 전체 로그 중 "유저ID: 입력한ID"가 포함된 라인만 필터링한 후 최신순 정렬
            const logs = lines.filter(line => line.includes(`유저ID: ${targetUserId}`)).reverse();

            if (logs.length === 0) {
                return message.reply(`📭 해당 유저[${userName}]에 대한 기록을 찾을 수 없습니다.`);
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
                    // 💡 제목을 "'유저 이름' 유저 로그" 형식으로 변경했습니다. (본문은 그대로 유지)
                    .setTitle(`${userName} 유저 로그`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x00aaff)
                    // 페이지 정보와 유저 ID는 바닥글로 내려서 깔끔하게 정리했습니다.
                    .setFooter({ text: `페이지: ${pageIndex + 1}/${totalPages} | 유저 ID: ${targetUserId}` });
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