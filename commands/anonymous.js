const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

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

        // 1. 유저에게 비밀 메시지로 먼저 알림을 보내고, 그 메시지를 변수(reply)에 저장
        const reply = await interaction.reply({ content: '🤫 익명 메시지가 안전하게 전송되었습니다!', ephemeral: true });

        // ⏱️ [핵심 기능] 3초(3000ms) 뒤에 나한테만 보이던 완료 알림을 자동으로 삭제하기
        setTimeout(async () => {
            try {
                await interaction.deleteReply();
            } catch (error) {
                console.error('알림 자동 삭제 중 에러 발생:', error);
            }
        }, 3000); // 3000은 3초를 뜻해! 만약 5초로 하고 싶다면 5000으로 바꾸면 돼.

        // 실시간 채널 목록 fetch (채널 이름 검색과 생성을 'Chip-익명방'으로 통일했어!)
        const channels = await guild.channels.fetch();
        let targetChannel = channels.find(ch => ch.name === 'chip-익명방' && ch.type === ChannelType.GuildText);

        // 서버 전체를 통틀어 채널이 진짜로 존재하지 않을 때만 딱 한 번만 새로 생성
        if (!targetChannel) {
            try {
                targetChannel = await guild.channels.create({
                    name: 'chip-익명방',
                    type: ChannelType.GuildText,
                    topic: 'Chip-익명방입니다. 자유롭게 즐겨보세요!',
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
                return interaction.followUp({ content: '❌ 봇에게 채널을 생성할 수 있는 권한(채널 관리하기)이 없습니다.', ephemeral: true });
            }
        }

        // 만능 회색(#72767d) 익명 박스(임베드) 꾸미기
        const anonymousEmbed = new EmbedBuilder()
            .setColor('#72767d')
            .setTitle('익명 메시지')
            .setDescription(`"${content}"`)
            .setTimestamp()
            .setFooter({ text: '서버 관리는 Chip' });

        // 최종 전송
        await targetChannel.send({ embeds: [anonymousEmbed] });
    },
};