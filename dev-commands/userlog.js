const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!유저로그',
    developerOnly: true,
    async execute(message) {
        const args = message.content.split(' ');
        
        // 유저 ID를 안 적으면 현재 명령어를 친 개발자님의 ID를 자동으로 가져옵니다.
        const targetUserId = args[1] || message.author.id;

        try {
            // 파일 존재 여부 체크
            if (!fs.existsSync('command-logs.txt')) {
                return message.reply('⚠️ `command-logs.txt` 파일이 존재하지 않습니다.');
            }

            let userNickname = '알 수 없는 유저';

            try {
                // 💡 현재 명령어를 입력한 서버(guild)에서 해당 유저의 멤버 정보를 가져옵니다.
                const member = await message.guild.members.fetch(targetUserId);
                // 서버 닉네임이 있으면 닉네임을, 없으면 디스코드 글로벌 닉네임(displayName)을 씁니다.
                userNickname = member.nickname || member.user.displayName;
            } catch {
                // 만약 그 유저가 이 서버에 없다면, 일반 유저 캐시에서 전역 닉네임이나 아이디를 가져옵니다.
                const targetUser = message.client.users.cache.get(targetUserId);
                if (targetUser) userNickname = targetUser.displayName || targetUser.username;
            }

            // 🚀 [최상으로 업그레이드] promises.readFile을 사용해 비동기로 로그 파일 읽기!
            const data = await fs.promises.readFile('command-logs.txt', 'utf8');
            
            const lines = data.split('\n').filter(line => line.trim() !== '');
            
            // 전체 로그 중 "유저ID: 입력한ID"가 포함된 라인만 필터링한 후 최신순 정렬
            const logs = lines.filter(line => line.includes(`유저ID: ${targetUserId}`)).reverse();

            if (logs.length === 0) {
                return message.reply(`📭 해당 유저[${userNickname}]에 대한 기록을 찾을 수 없습니다.`);
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

            // 💡 [컴포넌트 리팩토링] 버튼 상태 관리 함수 (단일 페이지 유무 및 수집 종료에 대응)
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

            // ⏱️ 버튼 제어 유효시간을 5분(300000ms)으로 넉넉하게 세팅
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

            // 🚀 5분의 제한시간이 끝났을 때 버튼을 자동으로 비활성화 마감 처리
            collector.on('end', async () => {
                try {
                    await response.edit({ components: [getRow(true)] });
                } catch (e) {
                    // 이미 관리자가 메시지를 지웠을 경우 발생할 수 있는 에러 씹기
                }
            });

        } catch (error) {
            console.error(error);
            message.reply('⚠️ 오류 발생: ' + error.message);
        }
    }
};