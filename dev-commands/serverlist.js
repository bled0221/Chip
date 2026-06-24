const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
    name: '!서버목록', // ◀ 프리픽스 형식 그대로 유지
    developerOnly: true,
    async execute(message) {
        const developerID = process.env.DEVELOPER_ID;
        if (message.author.id !== developerID) return;

        const guilds = Array.from(message.client.guilds.cache.values());
        const itemsPerPage = 10;
        let page = 0;
        
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

        // 💡 [핵심] flags를 사용하여 프리픽스 명령어에서도Ephemeral(나에게만 보임) 적용
        const response = await message.reply({ 
            embeds: [getEmbed(page)], 
            components: [getRow(page)],
            flags: [MessageFlags.Ephemeral] // 또는 flags: [1 << 6]
        });

        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 300000 
        });

        collector.on('collect', async i => {
            if (i.user.id !== developerID) {
                return i.reply({ content: '개발자만 제어할 수 있습니다.', flags: [MessageFlags.Ephemeral] });
            }

            if (i.customId === 'prev') page--;
            else if (i.customId === 'next') page++;

            // ephemeral 메시지 내부의 버튼이므로 i.update로 바로 갱신 가능합니다.
            await i.update({ embeds: [getEmbed(page)], components: [getRow(page)] });
        });

        collector.on('end', async () => {
            try {
                await response.edit({ components: [getRow(page, true)] });
            } catch (error) {
                // 에러 무시
            }
        });
    },
};