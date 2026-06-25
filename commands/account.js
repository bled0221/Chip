const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('계좌')
        .setDescription('계좌를 처음 개설하고 기본 칩을 받습니다.'),
    
    async execute(interaction) {
        const db = interaction.client.db; 
        const userId = interaction.user.id;
        const initialMoney = 10000; 

        await interaction.deferReply(); 

        try {
            // 1. 이미 가입된 유저인지 DB에서 조회
            const user = await db.get('SELECT * FROM users WHERE id = ?', userId);

            if (user) {
                // 이미 데이터가 있다면 중복 지급 차단!
                const embed = new EmbedBuilder()
                    .setColor(0x72767d)
                    .setTitle('계좌 개설 실패!')
                    .setDescription(`이미 계좌를 소유하고 계십니다!\n현재 잔액: **${user.money.toLocaleString()}칩**`);
   
                // 수정 완료: 답변을 먼저 보내고 나서 return으로 종료해야 해!
                await interaction.editReply({ embeds: [embed] });
                return; 
            }
            

            // 2. 가입되지 않은 신규 유저라면 DB에 새로 데이터 삽입 (INSERT)
            await db.run(
                'INSERT INTO users (id, money, last_daily) VALUES (?, ?, ?)',
                userId, initialMoney, 0
            );

            const embed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('계좌 개설 완료!')
                .setDescription(`기본 칩 **${initialMoney.toLocaleString()}칩**이 지급되었습니다.`)
                .setFooter({ text: '이제 더 많은 칩을 벌어보세요!' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            const reply = await interaction.editReply({ 
                content: '⚠️ DB 처리 중 오류가 발생했습니다: ' + error.message,
                flags: MessageFlags.Ephemeral 
            });
            setTimeout(() => reply.delete().catch(() => {}), 3000);
        }
    }
};