const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 디스코드 슬래시 명령어 설정
    data: new SlashCommandBuilder()
        .setName('추방')
        .setDescription('서버에서 특정 멤버를 추방합니다.')
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
            return interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 관리 권한이 필요합니다)', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // ⏱️ [생각 시간 확보]
        await interaction.deferReply();

        const targetMember = interaction.options.getMember('멤버');
        const reason = interaction.options.getString('사유') || '미작성'; 

        // [체크 2] 유저가 서버에 없는 경우
        if (!targetMember) {
            return interaction.editReply({ content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.' });
        }

        // [체크 3] 추방 대상이 봇 자신(Open Claw)일 경우
        if (targetMember.id === interaction.client.user.id) {
            return interaction.editReply({ content: '저를 추방할 수는 없습니다! 제가 마음에 안 드시나요..? 🥺' });
        }
        
        // [체크 4] 자기 자신을 추방하려 할 경우
        if (targetMember.id === interaction.user.id) {
            return interaction.editReply({ content: '자기 자신을 추방할 수는 없습니다!' });
        }

        // [체크 5] 대상이 봇보다 권한이 높아서 추방할 수 없는 경우
        if (!targetMember.kickable) {
            return interaction.editReply({ content: '❌ 봇의 권한이 부족하여 이 멤버를 추방할 수 없습니다. (역할 순위를 확인해주세요!)' });
        }

        try {
            // 1. 추방당한 사람에게 보낼 DM 임베드 생성
            const dmEmbed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle(` [${interaction.guild.name}] 서버 추방 안내 `)
                .setDescription(`**${interaction.guild.name}** 에서 추방되었음을 알려드립니다.`)
                .addFields(
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true }, // 담당 관리자를 위로 이동
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            // 🚀 [최상으로 업그레이드] DM 발송과 진짜 추방 처리를 동시에(병렬) 수행!
            // 유저가 DM을 차단(비공개)해 두었을 때 봇이 멈추는 것을 막기 위해 .catch()를 내부에 연결해 줍니다.
            await Promise.all([
                targetMember.send({ embeds: [dmEmbed] }).catch(() => {
                    console.log(`DM 발송 실패(차단됨): ${targetMember.user.tag}`);
                }),
                targetMember.kick(reason)
            ]);

            // 3. 서버 채팅방에 보여줄 성공 임베드 생성
            const successEmbed = new EmbedBuilder()
                .setColor(0x72767d)
                .setTitle('멤버 추방 완료')
                .setDescription(`**${targetMember.user.tag}** 님이 서버에서 추방되었습니다.`)
                .addFields(
                    { name: '추방 대상', value: `<@${targetMember.id}>`, inline: true },
                    { name: '담당 관리자', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '사유', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ 추방 처리 중 알 수 없는 오류가 발생했습니다.' });
        }
    },
};