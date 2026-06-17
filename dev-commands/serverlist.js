const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!서버목록',
    developerOnly: true,
    async execute(message) {
        const developerID = process.env.DEVELOPER_ID;
        if (message.author.id !== developerID) return;

        const guilds = Array.from(message.client.guilds.cache.values());
        const itemsPerPage = 10;
        let page = 0;
        
        // 💡 [안전장치] 서버가 0개일 때 maxPage가 음수(-1)가 되는 것을 방지
        const maxPage = Math.max(0, Math.ceil(guilds.length / itemsPerPage) - 1);

        const getEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageGuilds = guilds.slice(start, end);
            
            const guildList = pageGuilds
                .map(g => {
                    const ownerMention = `<@${g.ownerId}>`;
                    return `**${g.name}**\n\`ID: ${g.id}\` | 멤버: ${g.memberCount}명\n주인: ${ownerMention}`;
                })
                .join('\n\n');

            return new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle(`참여 중인 서버 목록 (${guilds.length}개 서버)`)
                .setDescription(guildList || '참여 중인 서버가 없습니다.')
                .setFooter({ text: `페이지 ${page + 1} / ${maxPage + 1}` });
        };

        // 💡 버튼을 만들어주는 함수 (종료되었을 때 모든 버튼을 비활성화하는 옵션 추가)
        const getRow = (page, isDisabled = false) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀ 이전')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isDisabled || page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('다음 ▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(isDisabled || page >= maxPage)
            );
        };

        const response = await message.reply({ 
            embeds: [getEmbed(page)], 
            components: [getRow(page)] 
        });

        // 5분 동안 버튼 신호 수집
        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 300000 
        });

        collector.on('collect', async i => {
            if (i.user.id !== developerID) {
                return i.reply({ content: '개발자만 제어할 수 있습니다.', ephemeral: true });
            }

            if (i.customId === 'prev') page--;
            else if (i.customId === 'next') page++;

            await i.update({ embeds: [getEmbed(page)], components: [getRow(page)] });
        });

        // 🚀 [최상으로 업그레이드] 5분이 지나 컬렉터가 다 닫혔을 때 실행되는 코드
        collector.on('end', async () => {
            try {
                // 화면에 남아있는 버튼들을 모두 회색 비활성화 상태로 바꾸어 오류를 원천 차단합니다.
                await response.edit({ components: [getRow(page, true)] });
            } catch (error) {
                // 메시지가 이미 지워졌을 때 생길 에러 무시
            }
        });
    },
};