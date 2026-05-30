// commands/clean.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // 1. 디플로이와 인덱스가 읽어갈 이 명령어의 메뉴판 정보
    data: new SlashCommandBuilder()
        .setName('청소')
        .setDescription('채팅방의 메시지를 삭제합니다.')
        .addIntegerOption(option => 
            option.setName('개수')
                .setDescription('삭제할 메시지의 개수를 입력하세요 (1~100)')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // 관리자 제한

    // 2. 실제로 작동할 청소 능력 알맹이
    async execute(interaction) {
        const amount = interaction.options.getInteger('개수');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '⚠️ 1부터 100 사이의 숫자를 입력해 주세요!', ephemeral: true });
        }

        try {
            // 봇이 생각 중인 상태로 만들기 (나한테만 보이게)
            await interaction.deferReply({ ephemeral: true });
            
            // 대량 삭제 실행
            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            
            // 삭제 완료 메시지로 업데이트
            await interaction.editReply({ content: `✨ 성공적으로 ${deletedMessages.size}개의 메시지를 청소했습니다!` });

            // ⏱️ [핵심 기능] 청소 완료 알림도 3초(3000ms) 뒤에 자동으로 흔적 없이 지우기!
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('청소 알림 자동 삭제 중 에러 발생:', error);
                }
            }, 3000);

        } catch (error) {
            console.error(error);
            // 에러가 났을 때도 메시지를 띄워주고 똑같이 3초 뒤에 지워줄게!
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