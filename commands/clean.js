// commands/clean.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('청소')
        .setDescription('채팅방의 메시지를 삭제합니다.')
        .addIntegerOption(option => 
            option.setName('개수')
                .setDescription('삭제할 메시지의 개수를 입력하세요 (1~100)')
                .setRequired(true)
        ),

    async execute(interaction) {
        // 권한 체크
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            // 💡 [변경] ephemeral: true 대신 flags: [MessageFlags.Ephemeral] 사용
            await interaction.reply({ content: '⚠️ 이 명령어를 사용할 권한이 없습니다! (메시지 관리 권한 필요)', flags: [MessageFlags.Ephemeral] });
            
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('권한 경고 메시지 삭제 중 에러 발생:', error);
                }
            }, 3000);
            
            return;
        }

        const amount = interaction.options.getInteger('개수');

        if (amount < 1 || amount > 100) {
            // 💡 [변경] flags: [MessageFlags.Ephemeral] 적용
            return interaction.reply({ content: '⚠️ 1부터 100 사이의 숫자를 입력해 주세요!', flags: [MessageFlags.Ephemeral] });
        }

        try {
            // 💡 [변경] deferReply에서도 ephemeral: true 대신 flags를 사용합니다.
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            await interaction.editReply({ content: `성공적으로 ${deletedMessages.size}개의 메시지를 청소했습니다!` });

            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('청소 알림 자동 삭제 중 에러 발생:', error);
                }
            }, 3000);

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 메시지를 청소하는 중에 오류가 발생했습니다. (2주가 지난 메시지는 지울 수 없어요!)' });
            
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('에러 알림 자동 삭제 중 에러 발생:', error);
                }
            }, 3000);
        }
    },
};