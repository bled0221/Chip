const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // 1. 디스코드 명령어 설정
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
        // [체크 1] 명령어를 쓴 사람에게 권한이 있는지 확인
        if (!interaction.member.permissions.has('KickMembers')) {
            await interaction.reply({ 
                content: '❌ 당신은 권한이 없습니다! (멤버 추방 권한이 필요합니다)', 
                ephemeral: true 
            });
            // ⏰ 3초 후 비밀 메시지 삭제
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        const targetMember = interaction.options.getMember('멤버');
        const reason = interaction.options.getString('사유'); 

        // 유저가 서버에 없는 경우
        if (!targetMember) {
            await interaction.reply({ 
                content: '❌ 서버에서 해당 멤버를 찾을 수 없습니다.', 
                ephemeral: true 
            });
            // ⏰ 3초 후 비밀 메시지 삭제
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
            return;
        }

        // 🛡️ [추가 예외 처리] 만약 추방하려는 대상이 봇 자신(Open Claw)일 경우
        if (targetMember.id === interaction.client.user.id) {
            await interaction.reply({ 
                content: '저를 추방할 수는 없습니다! 혹시 제가 마음에 안 드시나요..? 🥺', 
                ephemeral: true 
            });
            // ⏰ 5초 후 비밀 메시지 삭제
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        // 봇보다 권한이 높으면 추방 불가
        if (!targetMember.kickable) {
            await interaction.reply({ 
                content: '❌ Open Claw 의 권한이 부족하여 이 멤버를 추방할 수 없습니다. (서버 설정에서 Open Claw 의 역할 순위를 더 올려주세요!)', 
                ephemeral: true 
            });
            // ⏰ 5초 후 비밀 메시지 삭제
            setTimeout(() => interaction.deleteReply().catch(console.error), 5000);
            return;
        }

        try {
            // 💡 추방당하기 전에 유저에게 개인 메시지(DM) 보내기
            try {
                if (reason) {
                    await targetMember.send(`✉️ **${interaction.guild.name}** 서버에서 추방당하셨습니다.\n📄 **사유:** ${reason}`);
                } else {
                    await targetMember.send(`✉️ **${interaction.guild.name}** 서버에서 추방당하셨습니다.`);
                }
            } catch (dmError) {
                // DM 막혀있으면 패스
            }

            // 💡 진짜로 서버에서 추방하기
            await targetMember.kick(reason);

            // 📢 채팅방에 보여줄 성공 메시지
            if (reason) {
                await interaction.reply({ 
                    content: `👋 **${targetMember.user.tag}** 님이 서버에서 추방되었습니다.\n📄 **사유:** ${reason}` 
                });
            } else {
                await interaction.reply({ 
                    content: `👋 **${targetMember.user.tag}** 님이 서버에서 추방되었습니다.` 
                });
            }

        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: '❌ 오류가 발생했습니다.', 
                ephemeral: true 
            });
            // ⏰ 3초 후 비밀 메시지 삭제
            setTimeout(() => interaction.deleteReply().catch(console.error), 3000);
        }
    },
};