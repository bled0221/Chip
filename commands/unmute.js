// commands/unmute.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 디스코드 슬래시 명령어 설정
    data: new SlashCommandBuilder()
        .setName('언뮤트')
        .setDescription('특정 멤버의 타임아웃 상태를 해제합니다.')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('타임아웃을 해제할 멤버를 선택하세요.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('사유')
                .setDescription('해제하는 이유를 적으세요. (선택사항)')
                .setRequired(false)),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        // [체크 1] 관리자 권한 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 관리 권한이 필요합니다)', 
                flags: MessageFlags.Ephemeral 
            });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        await interaction.deferReply();

        const targetMember = interaction.options.getMember('멤버');
        const reason = interaction.options.getString('사유') || '미작성';

        if (!targetMember) {
            await interaction.editReply({ content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // [체크 2] 타임아웃 상태인지 확인
        if (!targetMember.communicationDisabledUntil) {
            await interaction.editReply({ content: '❌ 이 멤버는 현재 타임아웃 상태가 아닙니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        try {
            // 💡 타임아웃 해제 (시간을 null로 설정)
            await targetMember.timeout(null, reason);

            // 💡 성공 임베드
            const successEmbed = new EmbedBuilder()
                .setColor('#72767d')
                .setTitle('타임아웃 해제 완료')
                .setDescription(`**${targetMember.user.tag}** 님의 타임아웃이 해제되었습니다.`)
                .addFields(
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 해제 처리 중 오류가 발생했습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
        }
    },
};