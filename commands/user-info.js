const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');

module.exports = {
    // 1. 디스코드 명령어 설정
    data: new SlashCommandBuilder()
        .setName('유저')
        .setDescription('선택한 유저의 프로필 정보와 보유 칩을 확인합니다.')
        .addUserOption(option => 
            option.setName('멤버')
                .setDescription('정보를 확인할 멤버를 선택하세요.')
                .setRequired(true)
        ),

    // 2. 명령어 실행 코드
    async execute(interaction) {
        const db = interaction.client.db; // index.js에서 연동해둔 DB 가져오기
        const targetUser = interaction.options.getUser('멤버');

        // 🚀 DB 연산 및 서버 멤버 조회를 시작하기 전 봇이 응답을 준비 중 상태로 만듭니다 (에러 방지 가드)
        await interaction.deferReply(); 

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);

            // 🗄️ 데이터베이스에서 해당 유저의 칩 데이터 조회
            const userData = await db.get('SELECT money FROM users WHERE id = ?', targetUser.id);
            // 만약 아직 /계좌 개설을 안 해서 데이터가 없다면 기본값 0칩으로 표기
            const userChip = userData ? userData.money : 0;

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
            const sortedRoles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => b.position - a.position);

            const maxDisplayRoles = 15;
            const totalCustomRolesCount = sortedRoles.size;
            
            let customRolesDisplay = sortedRoles
                .first(maxDisplayRoles)
                .map(role => `<@&${role.id}>`)
                .join(' ');

            if (totalCustomRolesCount > maxDisplayRoles) {
                customRolesDisplay += ` \`외 ${totalCustomRolesCount - maxDisplayRoles}개\``;
            }

            const everyoneBadge = `<@&${interaction.guild.id}>`;
            const finalRoles = customRolesDisplay ? `${customRolesDisplay} ${everyoneBadge}` : everyoneBadge;

            // 💡 [레이아웃 변경] 본문 맨 첫 줄에 아무 수식어 없이 멘션만 툭 올려둡니다.
            let embedDescription = `<@${targetUser.id}>\n\n` +
                                   `**🆔 계정 유형**\n${userType}\n\n`;

            // 🤖 대상이 봇이 아닐 때(실제 유저일 때)만 '보유 중인 칩' 항목을 추가합니다.
            if (!targetUser.bot) {
                embedDescription += `**🪙 보유 중인 칩**\n**${userChip.toLocaleString()} 칩**\n\n`;
            }

            // 가입일 및 역할 정보 이어 붙이기 (맨 밑에 추가했던 중복 멘션은 완벽 제거)
            embedDescription += `**⏳ 디스코드 가입일**\n${joinedDiscordDate} (${joinedDiscordTime})\n\n` + 
                                `**🛬 서버 착륙일**\n${joinedServerDate} (${joinedServerTime})\n\n` + 
                                `**🎖️ 보유 중인 역할**\n${finalRoles}`;

            // 💡 최종 임베드 생성 (기존 디자인 100% 복구)
            const userEmbed = new EmbedBuilder()
                .setColor(0x72767d) 
                .setAuthor({ 
                    name: displayName, 
                    iconURL: targetUser.displayAvatarURL({ dynamic: true, size: 128 }) 
                })
                .setDescription(embedDescription)

            // 🚀 deferReply 상태이므로 editReply로 최종 전송
            await interaction.editReply({ embeds: [userEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '⚠️ 유저 정보를 불러오는 중 오류가 발생했습니다.' });
        }
    },
};