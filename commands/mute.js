const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 디스코드 슬래시 명령어 설정
    data: new SlashCommandBuilder()
        .setName('뮤트')
        .setDescription('특정 멤버의 채팅과 음성 참여를 일정 시간 동안 제한합니다. (타임아웃)')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('타임아웃할 멤버를 선택하세요.')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('시간')
                .setDescription('제한할 시간(분 단위, 최대 40,320분)을 입력하세요.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('사유')
                .setDescription('사유를 적으세요. (선택사항)')
                .setRequired(false)),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        // [체크 1] 관리자 권한 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 관리 권한이 필요합니다)', 
                flags: [MessageFlags.Ephemeral]
            });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        await interaction.deferReply();

        const targetMember = interaction.options.getMember('멤버');
        const minutes = interaction.options.getInteger('시간');
        const reason = interaction.options.getString('사유') || '미작성'; 

        // [체크 2] 유저가 서버에 없는 경우
        if (!targetMember) {
            await interaction.editReply({ content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // [체크 3] 봇 자신일 경우
        if (targetMember.id === interaction.client.user.id) {
            await interaction.editReply({ content: '저에게 타임아웃을 걸 수는 없습니다! 앞으로 더 열심히 할게요... 🥺' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 4000);
            return;
        }

        // [체크 4] 타임아웃 가능 여부 확인
        if (!targetMember.moderatable) {
            await interaction.editReply({ content: '❌ Chip의 권한이 부족하여 이 멤버를 제한할 수 없습니다. (서버 설정에서 Chip의 역할 순위를 더 올려주세요!)' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        // [체크 5] 시간 제한 (최대 28일 = 40,320분)
        if (minutes > 40320 || minutes <= 0) {
            await interaction.editReply({ content: '❌ 제한 시간은 1분에서 40,320분(28일) 사이여야 합니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        try {
            // 💡 [최적화] 불필요한 DM 과정을 완전히 생략하고 바로 타임아웃 찌르기!
            await targetMember.timeout(minutes * 60 * 1000, reason);

            // 💡 모두가 볼 수 있는 성공 임베드 전송 (당사자도 확인 가능)
            const successEmbed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('타임아웃 완료')
                .setDescription(`**${targetMember.user.tag}** 님이 ${minutes}분 동안 타임아웃 되었습니다.`)
                .addFields(
                    { name: '대상', value: `<@${targetMember.id}>`, inline: true },
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 타임아웃 처리 중 알 수 없는 오류가 발생했습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
        }
    },
};