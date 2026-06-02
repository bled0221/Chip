// commands/ban.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 디스코드 슬래시 명령어 설정
    data: new SlashCommandBuilder()
        .setName('차단')
        .setDescription('서버에서 특정 멤버를 영구적으로 차단합니다. (차단 안내와 사유가 차단된 멤버에게 Dm으로 전달됩니다.)')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('차단할 멤버를 선택하세요.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('사유')
                .setDescription('차단하는 이유를 적으세요. (선택사항)')
                .setRequired(false)),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        // [체크 1] 명령어를 쓴 관리자에게 차단 권한이 있는지 확인
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            await interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 차단 권한이 필요합니다)', 
                flags: MessageFlags.Ephemeral 
            });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // ⏱️ [생각 시간 확보]
        await interaction.deferReply();

        const targetMember = interaction.options.getMember('멤버');
        const reason = interaction.options.getString('사유') || '지정되지 않음'; 

        // [체크 2] 유저가 서버에 없는 경우
        if (!targetMember) {
            await interaction.editReply({ content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // [체크 3] 차단 대상이 봇 자신(Open Claw)일 경우
        if (targetMember.id === interaction.client.user.id) {
            await interaction.editReply({ content: '저를 차단할 수는 없습니다! 혹시 제가 뭘 잘못했나요..? 🥺' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 4000);
            return;
        }

        // [체크 4] 대상이 봇보다 권한이 높아서 차단할 수 없는 경우
        if (!targetMember.bannable) {
            await interaction.editReply({ content: '❌ Open Claw의 권한이 부족하여 이 멤버를 차단할 수 없습니다. (서버 설정에서 Open Claw의 역할 순위를 더 올려주세요!)' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        try {
            // 💡 1. 차단당한 사람에게 보낼 DM 임베드 생성
            const dmEmbed = new EmbedBuilder()
                .setColor('#72767d')
                .setTitle(`[${interaction.guild.name}] 서버 차단 안내`)
                .setDescription(`**${targetMember.user.username}**님은 **${interaction.guild.name}** 에서 차단되었음을 알려드립니다.`)
                .addFields(
                    { name: '사유', value: reason, inline: false },
                    { name: '담당 관리자', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false }
                )
                .setTimestamp();

            // DM 발송 시도
            try {
                await targetMember.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                // DM 차단 시 무시
            }

            // 💡 2. 진짜로 서버에서 유저 차단하기
            await targetMember.ban({ reason: reason });

            // 💡 3. 서버 채팅방에 보여줄 성공 임베드
            const successEmbed = new EmbedBuilder()
                .setColor('#72767d')
                .setTitle('멤버 차단 완료')
                .setDescription(`**${targetMember.user.tag}** 님이 서버에서 차단되었습니다.`)
                .addFields(
                    { name: '차단 대상', value: `<@${targetMember.id}>`, inline: true },
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 차단 처리 중 알 수 없는 오류가 발생했습니다.' });
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
        }
    },
};