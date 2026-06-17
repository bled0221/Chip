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
            // 파일 존재 여부 체크
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            // 봇의 캐시에서 서버를 찾고, 있으면 이름을 가져옵니다.
            const targetGuild = message.client.guilds.cache.get(targetGuildId);
            const guildName = targetGuild ? targetGuild.name : '알 수 없는 서버';

            // 비동기로 로그 파일 읽기 (서버 블로킹 방지)
            const data = await fs.promises.readFile('command-logs.txt', 'utf8');
            
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
                    .setTitle(`${guildName} 서버 로그`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x72767d)
                    .setFooter({ text: `페이지: ${pageIndex + 1}/${totalPages} | 서버 ID: ${targetGuildId}` });
            };

            // 버튼 컴포넌트 생성 함수
            const getRow = (isDisabled = false) => {
                const shouldDisable = isDisabled || totalPages <= 1;
                
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('이전')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(shouldDisable),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('다음')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(shouldDisable)
                );
            };

            const response = await message.reply({ 
                embeds: [generateEmbed(page)], 
                components: [getRow()] 
            });

            // 🚀 [수정] 제한시간을 300000ms (5분)로 변경 완료!
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 300000 
            });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ content: '직접 사용하세요!', ephemeral: true });
                }
                
                if (i.customId === 'prev') page = page > 0 ? --page : totalPages - 1;
                else page = page < totalPages - 1 ? ++page : 0;
                
                await i.update({ embeds: [generateEmbed(page)], components: [getRow()] });
            });

            // 5분이 지나 수집이 끝나면 버튼을 회색으로 잠금
            collector.on('end', async () => {
                try {
                    await response.edit({ components: [getRow(true)] });
                } catch (e) {
                    // 메시지가 이미 삭제되었을 때 에러 방지
                }
            });

        } catch (error) {
            console.error(error);
            message.reply('⚠️ 오류 발생: ' + error.message);
        }
    }
};