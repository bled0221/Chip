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
            await interaction.reply({ content: '⚠️ 이 명령어를 사용할 권한이 없습니다! (메시지 관리 권한 필요)', flags: [MessageFlags.Ephemeral] });
            
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { console.error(e); }
            }, 3000);
            return;
        }

        const amount = interaction.options.getInteger('개수');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: '⚠️ 1부터 100 사이의 숫자를 입력해 주세요!', flags: [MessageFlags.Ephemeral] });
        }

        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            
            // 🚀 [최상으로 업그레이드] 
            // 1. 메시지를 지우는 무거운 작업(bulkDelete)과
            // 2. 유저에게 "청소 중이니 잠시만 기다려달라"고 화면을 고쳐주는 작업(editReply)을 동시에 처리!
            const [deletedMessages, _] = await Promise.all([
                interaction.channel.bulkDelete(amount, true),
                interaction.editReply({ content: '메시지를 청소하는 중입니다... 잠시만 기다려주세요!' })
            ]);
            
            // 위의 두 작업이 모두 끝나면, 진짜로 지워진 개수(.size)를 안전하게 가져와서 최종 완료 문구를 띄웁니다!
            await interaction.editReply({ content: `성공적으로 ${deletedMessages.size}개의 메시지를 청소했습니다!` });

            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { console.error(e); }
            }, 3000);

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 메시지를 청소하는 중에 오류가 발생했습니다. (2주가 지난 메시지는 지울 수 없어요!)' });
            
            setTimeout(async () => {
                try { await interaction.deleteReply(); } catch (e) { console.error(e); }
            }, 3000);
        }
    },
};