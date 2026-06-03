const fs = require('node:fs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    name: '!로그',
    developerOnly: true,
    async execute(message) {
        const args = message.content.split(' ');
        const targetGuildId = args[1];

        if (!targetGuildId) return message.reply('❌ 사용법: `!로그 [서버ID]`');

        const data = fs.readFileSync('command-logs.txt', 'utf8');
        const logs = data.split('\n').filter(line => line.includes(`서버ID: ${targetGuildId}`));

        if (logs.length === 0) return message.reply('📭 해당 서버의 기록이 없습니다.');

        // 5개씩 페이지 나누기
        const pageSize = 5;
        let page = 0;
        const totalPages = Math.ceil(logs.length / pageSize);

        const generateEmbed = (pageIndex) => {
            const start = pageIndex * pageSize;
            const end = start + pageSize;
            const pageLogs = logs.slice(start, end).join('\n');
            return new EmbedBuilder()
                .setTitle(`📜 서버 로그 (${pageIndex + 1}/${totalPages})`)
                .setDescription(`\`\`\`${pageLogs || '기록 없음'}\`\`\``)
                .setColor(0x0099ff);
        };

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('이전').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('next').setLabel('다음').setStyle(ButtonStyle.Primary)
        );

        const response = await message.reply({ embeds: [generateEmbed(page)], components: [row] });

        // 버튼 클릭 이벤트 처리
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== message.author.id) return i.reply({ content: '직접 사용하세요!', ephemeral: true });

            if (i.customId === 'prev') page = page > 0 ? --page : totalPages - 1;
            else page = page < totalPages - 1 ? ++page : 0;

            await i.update({ embeds: [generateEmbed(page)], components: [row] });
        });
    }
};