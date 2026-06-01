// commands/userinfo.js
const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');

module.exports = {
    // 1. 디스코드 명령어 설정
    data: new SlashCommandBuilder()
        .setName('개인정보')
        .setDescription('선택한 유저의 프로필 정보를 확인합니다.')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('정보를 확인할 멤버를 선택하세요.')
                .setRequired(true)
        ),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        const targetUser = interaction.options.getUser('멤버');
        const member = await interaction.guild.members.fetch(targetUser.id);

        // 👑 서버장(소유자) 여부 확인
        const isOwner = interaction.guild.ownerId === targetUser.id;
        
        // 🏷️ 영문 계정 이름 제외, 오직 디스코드 닉네임만 조립
        const nickname = targetUser.globalName || targetUser.username; 
        let displayName = '';

        if (member.nickname) {
            displayName = `${nickname} (${member.nickname})`;
        } else {
            displayName = `${nickname}`;
        }

        // 서버 주인이라면 이름 맨 뒤에 왕관 추가
        if (isOwner) {
            displayName += ' 👑';
        }

        // 🤖 봇 여부 텍스트
        const userType = targetUser.bot ? 'App' : 'User';

        // 📅 디스코드 가입일 및 서버 입장일 타임스탬프 처리
        const joinedDiscordTime = time(targetUser.createdAt, 'R');
        const joinedServerTime = time(member.joinedAt, 'R');
        
        const joinedDiscordDate = time(targetUser.createdAt, 'F');
        const joinedServerDate = time(member.joinedAt, 'F');

        // 🎖️ [역할 목록 조립] @everyone까지 완벽하게 배지 모양으로 통일
        // 1. @everyone을 제외한 일반 역할들을 배지 형태로 먼저 모읍니다.
        const customRoles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `<@&${role.id}>`)
            .join(' ');

        // 2. 디스코드에서 @everyone 역할의 ID는 '서버 ID'와 같습니다.
        // 서버 ID를 이용해 똑같은 배지 형태(<@&서버ID>)로 만들어 줍니다.
        const everyoneBadge = `<@&${interaction.guild.id}>`;

        // 3. 다른 역할이 있다면 배지 뒤에 나란히 붙이고, 없다면 @everyone 배지만 단독 출력합니다.
        const finalRoles = customRoles ? `${customRoles} ${everyoneBadge}` : everyoneBadge;

        // 💡 [최종 레이아웃 고정] 작은 상단 프로필 + 촘촘한 간격 + 배지 모양 통일
        const userEmbed = new EmbedBuilder()
            .setColor('#72767d')
            .setAuthor({ 
                name: displayName, 
                iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 128 }) 
            })
            .setDescription(
                `**🆔 계정 유형**\n${userType}\n\n` + 
                `**⏳ 디스코드 가입일**\n${joinedDiscordDate} (${joinedDiscordTime})\n\n` + 
                `**🛬 서버 착륙일**\n${joinedServerDate} (${joinedServerTime})\n\n` + 
                `**🎖️ 보유 중인 역할**\n${finalRoles}` // 👈 이제 모두 같은 동글동글한 배지로 출력됨!
            )
            .setTimestamp();

        // 완성된 임베드 전송
        await interaction.reply({ embeds: [userEmbed] });
    },
};