const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');

module.exports = {
    // 1. 디스코드 명령어 설정
    data: new SlashCommandBuilder()
        .setName('유저')
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

        // 🎖️ [역할 목록 조립] 높은 역할 순 정렬 + 글자 수 초과 방어 코드 적용
        // 1. @everyone을 제외하고 높은 순서(position)대로 정렬(sort)합니다.
        const sortedRoles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

        // 2. 역할이 너무 많으면 임베드가 터지므로 최대 15개까지만 표기하고 나머지는 생략 처리합니다.
        const maxDisplayRoles = 15;
        const totalCustomRolesCount = sortedRoles.size;
        
        let customRolesDisplay = sortedRoles
            .first(maxDisplayRoles) // 상위 15개만 자르기
            .map(role => `<@&${role.id}>`)
            .join(' ');

        if (totalCustomRolesCount > maxDisplayRoles) {
            customRolesDisplay += ` \`외 ${totalCustomRolesCount - maxDisplayRoles}개\``;
        }

        // 3. 디스코드에서 @everyone 역할의 ID는 '서버 ID'와 같습니다.
        const everyoneBadge = `<@&${interaction.guild.id}>`;

        // 4. 최종 역할 텍스트 결합
        const finalRoles = customRolesDisplay ? `${customRolesDisplay} ${everyoneBadge}` : everyoneBadge;

        // 💡 [최종 레이아웃 고정] 작은 상단 프로필 + 촘촘한 간격 + 배지 모양 통일
        const userEmbed = new EmbedBuilder()
            .setColor(0x72767d) 
            .setAuthor({ 
                name: displayName, 
                iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 128 }) 
            })
            .setDescription(
                `**🆔 계정 유형**\n${userType}\n\n` + 
                `**⏳ 디스코드 가입일**\n${joinedDiscordDate} (${joinedDiscordTime})\n\n` + 
                `**🛬 서버 착륙일**\n${joinedServerDate} (${joinedServerTime})\n\n` + 
                `**🎖️ 보유 중인 역할**\n${finalRoles}`
            )
            .setTimestamp();

        // 완성된 임베드 전송
        await interaction.reply({ embeds: [userEmbed] });
    },
};