const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!서버목록',
    async execute(message) {
        const developerID = process.env.DEVELOPER_ID;
        if (message.author.id !== developerID) return;

        const guilds = Array.from(message.client.guilds.cache.values());
        const itemsPerPage = 10;
        let page = 0;
        const maxPage = Math.ceil(guilds.length / itemsPerPage) - 1;

        const getEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageGuilds = guilds.slice(start, end);
            
            const guildList = pageGuilds
                .map(g => `• **${g.name}**\n\`ID: ${g.id}\``)
                .join('\n\n');

            return new EmbedBuilder()
                .setColor(0x72767d) // 적용 완료!
                .setTitle(`참여 중인 서버 목록 (${guilds.length}개 서버)`)
                .setDescription(guildList || '참여 중인 서버가 없습니다.')
                .setFooter({ text: `페이지 ${page + 1} / ${maxPage + 1}` });
        };

        const getRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('◀ 이전').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next').setLabel('다음 ▶').setStyle(ButtonStyle.Primary).setDisabled(page >= maxPage)
            );
        };

        const response = await message.reply({ 
            embeds: [getEmbed(page)], 
            components: [getRow(page)] 
        });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== developerID) return i.reply({ content: '개발자만 제어할 수 있습니다.', ephemeral: true });

            if (i.customId === 'prev') page--;
            else if (i.customId === 'next') page++;

            await i.update({ embeds: [getEmbed(page)], components: [getRow(page)] });
        });
    },
};