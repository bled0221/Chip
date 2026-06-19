const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('계좌')
        .setDescription('계좌를 처음 개설하고 시드머니를 받습니다.'),
    
    async execute(interaction) {
        const db = interaction.client.db; // index.js에서 연동해둔 DB 가져오기
        const userId = interaction.user.id;
        const initialMoney = 50000; // 초기 지급금 (만 원)

        await interaction.deferReply(); // DB 연산 시간 동안 봇이 멈춘 것처럼 보이지 않게 가드

        try {
            // 1. 이미 가입된 유저인지 DB에서 조회
            const user = await db.get('SELECT * FROM users WHERE id = ?', userId);

            if (user) {
                // 이미 데이터가 있다면 중복 지급 차단!
                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('❌ 계좌 개설 실패')
                    .setDescription(`이미 계좌를 소유하고 계십니다!\n현재 잔액: **${user.money.toLocaleString()}원**`)
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // 2. 가입되지 않은 신규 유저라면 DB에 새로 데이터 삽입 (INSERT)
            await db.run(
                'INSERT INTO users (id, money, last_daily) VALUES (?, ?, ?)',
                userId, initialMoney, 0
            );

            const embed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('계좌 개설 완료!')
                .setDescription(`축하합니다! 성공적으로 계좌가 만들어졌습니다.\n기본 시드머니 **${initialMoney.toLocaleString()}원**이 지급되었습니다.`)
                .setFooter({ text: '이제 더 많은 돈을 벌어보세요!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '⚠️ DB 처리 중 오류가 발생했습니다: ' + error.message });
        }
    }
};