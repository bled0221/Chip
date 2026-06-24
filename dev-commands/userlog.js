const fs = require('node:fs');
// 💡 상단에 MessageFlags를 포함하여 직관적인 형식 유지
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
    name: '!유저로그',
    developerOnly: true,
    async execute(message) {
        // 🔒 [보안 추가] 개발자가 아니면 즉시 차단하여 코드를 종료합니다.
        const developerID = process.env.DEVELOPER_ID;
        if (message.author.id !== developerID) return;

        const args = message.content.split(' ');
        
        // 유저 ID를 안 적으면 현재 명령어를 친 개발자님의 ID를 자동으로 가져옵니다.
        const targetUserId = args[1] || message.author.id;

        try {
            // 파일 존재 여부 체크
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('`command-logs.txt` 파일이 존재하지 않습니다.');
            }

            let userNickname = '알 수 없는 유저';

            try {
                // 현재 명령어를 입력한 서버(guild)에서 해당 유저의 멤버 정보를 가져옵니다.
                const member = await message.guild.members.fetch(targetUserId);
                userNickname = member.nickname || member.user.displayName;
            } catch {
                // 만약 그 유저가 이 서버에 없다면, 일반 유저 캐시에서 전역 닉네임이나 아이디를 가져옵니다.
                const targetUser = message.client.users.cache.get(targetUserId);
                if (targetUser) userNickname = targetUser.displayName || targetUser.username;
            }

            // 비동기로 로그 파일 읽기 (서버 블로킹 방지)
            const data = await fs.promises.readFile('command-logs.txt', 'utf8');
            
            const lines = data.split('\n').filter(line => line.trim() !== '');
            
            // 전체 로그 중 "유저ID: 입력한ID"가 포함된 라인만 필터링한 후 최신순 정렬
            const logs = lines.filter(line => line.includes(`유저ID: ${targetUserId}`)).reverse();

            if (logs.length === 0) {
                return message.reply(`해당 유저[${userNickname}]에 대한 기록을 찾을 수 없습니다.`);
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
                    .setTitle(`${userNickname} 유저 로그`)
                    .setDescription(pageLogs || '기록 없음')
                    .setColor(0x72767d)
                    .setFooter({ text: `페이지: ${pageIndex + 1}/${totalPages} | 유저 ID: ${targetUserId}` });
            };

            // 💡 [버튼 기능 개선] 현재 페이지 번호를 받아 첫/마지막 페이지에서 버튼을 비활성화
            const getRow = (pageIndex, isDisabled = false) => {
                const shouldDisable = isDisabled || totalPages <= 1;
                
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('◀ 이전')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(shouldDisable || pageIndex === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('다음 ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(shouldDisable || pageIndex >= totalPages - 1)
                );
            };

            // 💡 [핵심] MessageFlags.Ephemeral를 사용하여 첫 응답부터 개발자 본인에게만 보이도록 설정
            const response = await message.reply({ 
                embeds: [generateEmbed(page)], 
                components: [getRow(page)],
                flags: [MessageFlags.Ephemeral]
            });

            // 버튼 제어 유효시간 5분(300000ms) 설정
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 300000 
            });

            collector.on('collect', async i => {
                // 🔒 [보안 강화] 버튼 제어 역시 오직 개발자만 가능하도록 developerID로 검증
                if (i.user.id !== developerID) {
                    return i.reply({ content: '개발자만 제어할 수 있습니다.', flags: [MessageFlags.Ephemeral] });
                }
                
                if (i.customId === 'prev') page--;
                else if (i.customId === 'next') page++;
                
                // ephemeral 메시지 내부의 버튼이므로 i.update로 바로 갱신 가능합니다.
                await i.update({ embeds: [generateEmbed(page)], components: [getRow(page)] });
            });

            // 5분의 제한시간이 끝났을 때 버튼 비활성화
            collector.on('end', async () => {
                try {
                    await response.edit({ components: [getRow(page, true)] });
                } catch (e) {
                    // 이미 메시지가 지워진 경우 에러 방지
                }
            });

        } catch (error) {
            console.error(error);
            message.reply('오류 발생: ' + error.message);
        }
    }
};