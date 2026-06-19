const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
            // 1. 유저 정보 조회
            let user = await db.get('SELECT * FROM users WHERE id = ?', userId);
            
            // 계좌 없는 유저 방어
            if (!user) {
                return await interaction.editReply('❌ 먼저 **/계좌**를 이용하여 계좌를 개설해주세요!');
            }

            // 2. 시간 계산 (현재 시간과 마지막 수령 시간 비교)
            const now = Date.now();
            const lastDaily = user.last_daily;
            const twentyFourHours = 24 * 60 * 60 * 1000;

            // 이미 오늘 받았는지 확인
            if (now - lastDaily < twentyFourHours) {
                const remaining = twentyFourHours - (now - lastDaily);
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                
                // ⏳ 쿨타임 임베드
                const cooldownEmbed = new EmbedBuilder()
                    .setColor(0x72767d)
                    .setTitle('칩 획득 실패!')
                    .setDescription(`돈통이 굳게 닫혀있습니다.\n**${hours}시간 ${minutes}분** 뒤에 다시 찾아와주세요!`)

                return await interaction.editReply({ embeds: [cooldownEmbed] });
            }

            // 3. 보상 지급 및 DB 업데이트
            await db.run('UPDATE users SET money = money + ?, last_daily = ? WHERE id = ?', [reward, now, userId]);

            // 봇 자신의 멘션 가져오기
            const botMention = interaction.client.user.toString();

            const embed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('칩 획득!')
                .setDescription(`${botMention}의 돈통에서 몰래 칩을 꺼냈습니다!\n오늘의 보상 **2,000 칩**이 지급되었습니다.`)

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '⚠️ 시스템 오류가 발생했습니다.' });
        }
    }
};