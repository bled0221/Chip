const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('돈통')
        .setDescription('매일 오전 6시에 초기화되는 2,000 칩을 받습니다.'),

    async execute(interaction) {
        const db = interaction.client.db;
        const userId = interaction.user.id;
        const reward = 2000;

        await interaction.deferReply();

        try {
            let user = await db.get('SELECT * FROM users WHERE id = ?', userId);
            
            if (!user) {
                const reply = await interaction.editReply({ 
                    content: '먼저 **/계좌**를 이용하여 계좌를 개설해주세요!',
                    flags: MessageFlags.Ephemeral 
                });
                setTimeout(() => reply.delete().catch(() => {}), 3000);
                return;
            }

            // 1. 한국 시간 계산
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
            const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
            const krDate = new Date(utc + KR_TIME_DIFF);
            
            const todayStr = krDate.toISOString().slice(0, 10).replace(/-/g, '');
            const currentHour = krDate.getHours();
            const effectiveDate = currentHour < 6 
                ? (new Date(krDate.getTime() - 24 * 60 * 60 * 1000)).toISOString().slice(0, 10).replace(/-/g, '') 
                : todayStr;

            // 2. 이미 오늘 받았는지 확인
            if (user.last_daily == effectiveDate) {
                // 남은 시간 계산 (오전 6시까지)
                const nextReset = new Date(krDate);
                if (currentHour >= 6) nextReset.setDate(nextReset.getDate() + 1);
                nextReset.setHours(6, 0, 0, 0);
                
                const diff = nextReset - krDate;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                const embed = new EmbedBuilder()
                    .setColor(0x72767d)
                    .setTitle('칩 획득 실패!')
                    .setDescription(`돈통이 굳게 닫혀있습니다.\n**${hours}시간 ${minutes}분** 뒤에 다시 시도해주세요!`);

                const reply = await interaction.editReply({ 
                    embeds: [embed], 
                    flags: MessageFlags.Ephemeral 
                });
                setTimeout(() => reply.delete().catch(() => {}), 5000);
                return;
            }

            // 3. 보상 지급 및 DB 업데이트
            await db.run('UPDATE users SET money = money + ?, last_daily = ? WHERE id = ?', [reward, effectiveDate, userId]);

            const botMention = interaction.client.user.toString();
            const embed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('칩 획득!')
                .setDescription(`${botMention}의 돈통에서 몰래 칩을 꺼냈습니다!\n오늘의 보상 **2,000 칩**을 획득했습니다.`);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            const reply = await interaction.editReply({ 
                content: '⚠️ 시스템 오류가 발생했습니다.', 
                flags: MessageFlags.Ephemeral 
            });
            setTimeout(() => reply.delete().catch(() => {}), 3000);
        }
    }
};