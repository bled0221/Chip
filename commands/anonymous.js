const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('익명')
        .setDescription('당신의 이름을 숨기고 익명으로 메시지를 보냅니다.')
        .addStringOption(option =>
            option.setName('내용')
                .setDescription('익명으로 전송할 내용을 적어주세요.')
                .setRequired(true)),

    async execute(interaction) {
        const content = interaction.options.getString('내용');
        const guild = interaction.guild; // 명령어가 사용된 디스코드 서버

        // 🚀 [최상으로 업그레이드] 비밀 메시지 알림과 채널 목록 가져오기를 동시에(병렬) 처리!
        const [reply, channels] = await Promise.all([
            interaction.reply({ 
                content: '🤫 익명 메시지가 안전하게 전송되었습니다!', 
                flags: MessageFlags.Ephemeral 
            }),
            guild.channels.fetch()
        ]);

        // ⏱️ [핵심 기능] 3초(3000ms) 뒤에 나한테만 보이던 완료 알림을 자동으로 삭제하기
        setTimeout(async () => {
            try {
                await interaction.deleteReply();
            } catch (error) {
                console.error('알림 자동 삭제 중 에러 발생:', error);
            }
        }, 3000); // 3000은 3초를 뜻해! 만약 5초로 하고 싶다면 5000으로 바꾸면 돼.

        // 가져온 채널 목록에서 바로 검색 (Promise.all 덕분에 이미 channels 데이터가 완성되어 있습니다)
        let targetChannel = channels.find(ch => ch.name === '칩-익명방' && ch.type === ChannelType.GuildText);

        // 서버 전체를 통틀어 채널이 진짜로 존재하지 않을 때만 딱 한 번만 새로 생성 (순서가 중요하므로 기존 await 유지)
        if (!targetChannel) {
            try {
                targetChannel = await guild.channels.create({
                    name: '칩-익명방',
                    type: ChannelType.GuildText,
                    topic: '칩-익명방입니다. 자유롭게 즐겨보세요!',
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel, 
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.SendMessages // 일반 유저들도 리액션 댓글을 달 수 있게 채팅 전면 허용
                            ]
                        }
                    ]
                });
            } catch (error) {
                console.error('채널 생성 중 에러 발생:', error);
                return interaction.followUp({ 
                    content: '❌ 봇에게 채널을 생성할 수 있는 권한(채널 관리하기)이 없습니다.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }

        // 만능 회색(#72767d) 익명 박스(임베드) 꾸미기
        const anonymousEmbed = new EmbedBuilder()
            .setColor(0x72767d)
            .setTitle('익명 메시지')
            .setDescription(`"${content}"`)
            .setTimestamp()

        // 최종 전송 (채널이 완벽히 준비된 후 가야 하므로 기존 await 유지)
        await targetChannel.send({ embeds: [anonymousEmbed] });
    },
};