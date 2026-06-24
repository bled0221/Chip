const fs = require('node:fs');
// 💡 상단에 MessageFlags를 깔끔하게 포함하여 구조 유지
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
    name: '!서버로그',
    developerOnly: true,
    async execute(message) {
        // 🔒 [보안 추가] 개발자가 아니면 즉시 차단하여 완벽히 무시합니다.
        const developerID = process.env.DEVELOPER_ID;
        if (message.author.id !== developerID) return;

        const args = message.content.split(' ');
        
        // ID를 안 적으면 현재 서버 ID를 자동으로 가져옵니다.
        const targetGuildId = args[1] || message.guildId;

        if (!targetGuildId) return message.reply('`!서버로그 서버ID` 형식을 사용해주세요.');

        try {
            // 파일 존재 여부 체크
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('`command-logs.txt` 파일이 존재하지 않습니다.');
            }

            // 봇의 캐시에서 서버를 찾고, 있으면 이름을 가져옵니다.
            const targetGuild = message.client.guilds.cache.get(targetGuildId);
            const guildName = targetGuild ? targetGuild.name : '알 수 없는 서버';

            // 비동기로 로그 파일 읽기 (서버 블로킹 방지)
            const data = await fs.promises.readFile('command-logs.txt', 'utf8');
            
            const lines = data.split('\n').filter(line => line.trim() !== '');
            const logs = lines.filter(line => line.includes(targetGuildId)).reverse();

            if (logs.length === 0) {
                return message.reply(`해당 서버 ID(${targetGuildId})에 대한 기록을 찾을 수 없습니다.`);
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

            // 버튼 컴포넌트 생성 함수 (이전/다음 경계선 상태 반영 및 종료 시 완전 비활성화)
            const getRow = (pageIndex, isDisabled = false) => {
                const shouldDisable = isDisabled || totalPages <= 1;
                
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀ 이전')
                        .setStyle(ButtonStyle.Primary)
                        // 💡 첫 페이지면 이전 버튼 비활성화
                        .setDisabled(shouldDisable || pageIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('다음 ▶')
                        .setStyle(ButtonStyle.Primary)
                        // 💡 마지막 페이지면 다음 버튼 비활성화
                        .setDisabled(shouldDisable || pageIndex >= totalPages - 1)
                );
            };

            // 💡 [핵심] MessageFlags.Ephemeral를 사용하여 가독성 있게 나에게만 보임 적용
            const response = await message.reply({ 
                embeds: [generateEmbed(page)], 
                components: [getRow(page)],
                flags: [MessageFlags.Ephemeral]
            });

            // 5분 동안 버튼 신호 수집
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 300000 
            });

            collector.on('collect', async i => {
                // 🔒 [보안 강화] 버튼 클릭도 message.author.id 대신 확실한 developerID로 체크
                if (i.user.id !== developerID) {
                    return i.reply({ content: '개발자만 제어할 수 있습니다.', flags: [MessageFlags.Ephemeral] });
                }
                
                if (i.customId === 'prev') page--;
                else if (i.customId === 'next') page++;
                
                // ephemeral 메시지 내부의 버튼이므로 i.update로 바로 갱신 가능합니다.
                await i.update({ embeds: [generateEmbed(page)], components: [getRow(page)] });
            });

            // 5분이 지나 수집이 끝나면 버튼을 회색으로 잠금
            collector.on('end', async () => {
                try {
                    await response.edit({ components: [getRow(page, true)] });
                } catch (e) {
                    // 메시지가 이미 삭제되었을 때 에러 방지
                }
            });

        } catch (error) {
            console.error(error);
            message.reply('오류 발생: ' + error.message);
        }
    }
};