// commands/kick.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 디스코드 슬래시 명령어 설정
    data: new SlashCommandBuilder()
        .setName('추방')
        .setDescription('서버에서 특정 멤버를 추방합니다. (추방 안내와 사유가 추방된 멤버에게 Dm으로 전달됩니다.)')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('추방할 멤버를 선택하세요.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('사유')
                .setDescription('추방하는 이유를 적으세요. (선택사항)')
                .setRequired(false)),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        // [체크 1] 명령어를 쓴 관리자에게 추방 권한이 있는지 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            await interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 관리 권한이 필요합니다)', 
                flags: MessageFlags.Ephemeral 
            });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // ⏱️ [생각 시간 확보] DM 발송 및 추방 처리에 시간이 걸리므로 디스코드와의 연결 유지
        await interaction.deferReply();

        const targetMember = interaction.options.getMember('멤버');
        const reason = interaction.options.getString('사유') || '미작성'; 

        // [체크 2] 유저가 서버에 없는 경우
        if (!targetMember) {
            await interaction.editReply({ content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // [체크 3] 추방 대상이 봇 자신(Open Claw)일 경우
        if (targetMember.id === interaction.client.user.id) {
            await interaction.editReply({ content: '저를 추방할 수는 없습니다! 제가 마음에 안 드시나요..? 🥺' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 4000);
            return;
        }

        // [체크 4] 대상이 봇보다 권한이 높아서 추방할 수 없는 경우
        if (!targetMember.kickable) {
            await interaction.editReply({ content: '❌ Open Claw의 권한이 부족하여 이 멤버를 추방할 수 없습니다. (서버 설정에서 Open Claw의 역할 순위를 더 올려주세요!)' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        try {
            // 💡 1. 추방당한 사람에게 보낼 DM 임베드 생성 (누가 추방했는지 포함)
            const dmEmbed = new EmbedBuilder()
                .setColor('#72767d')
                .setTitle(`[${interaction.guild.name}] 서버 추방 안내`)
                .setDescription(`**${targetMember.user.username}**님은 **${interaction.guild.name}** 에서 추방되었음을 알려드립니다.`)
                .addFields(
                    { name: '사유', value: reason, inline: false },
                    { name: '담당 관리자', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
                )
                .setTimestamp();

            // DM 발송 시도
            try {
                await targetMember.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // 유저가 DM을 막아둔 경우 조용히 패스
            }

            // 💡 2. 진짜로 서버에서 유저 추방하기
            await targetMember.kick(reason);

            // 💡 3. 서버 채팅방에 보여줄 성공 임베드 생성
            const successEmbed = new EmbedBuilder()
                .setColor('#72767d')
                .setTitle('멤버 추방 완료')
                .setDescription(`**${targetMember.user.tag}** 님이 서버에서 추방되었습니다.`)
                .addFields(
                    { name: '추방 대상', value: `<@${targetMember.id}>`, inline: true },
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            // 💡 대기 상태를 끝마치며 성공 임베드 출력
            await interaction.editReply({ content: '', embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 추방 처리 중 알 수 없는 오류가 발생했습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
        }
    },
};