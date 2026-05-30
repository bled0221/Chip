const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('뒷담')
        .setDescription('당신의 이름을 숨기고 익명으로 메시지를 보냅니다.')
        .addStringOption(option =>
            option.setName('내용')
                .setDescription('익명으로 전송할 내용을 적어주세요.')
                .setRequired(true)),

    async execute(interaction) {
        const content = interaction.options.getString('내용');
        const guild = interaction.guild; // 명령어가 사용된 디스코드 서버

        // 유저에게는 비밀 메시지로 먼저 전송 완료 알림 보내기 (익명 보장)
        await interaction.reply({ content: '🤫 익명 제보가 안전하게 전송되었습니다!', ephemeral: true });

        // [해결 키포인트] 봇의 임시 기억(캐시) 대신, 디스코드 서버에서 실시간 채널 목록을 진짜로 받아와서 검사!
        const channels = await guild.channels.fetch();
        let targetChannel = channels.find(ch => ch.name === '익명-뒷담방' && ch.type === ChannelType.GuildText);

        // 서버 전체를 통틀어 '익명-뒷담방'이 진짜로 존재하지 않을 때만 딱 한 번만 새로 생성
        if (!targetChannel) {
            try {
                targetChannel = await guild.channels.create({
                    name: 'Open Claw-뒷담방',
                    type: ChannelType.GuildText,
                    topic: 'Open Claw-뒷담방입니다. 자유롭게 즐겨보세요!',
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

        // 익명 박스(임베드) 꾸미기
        const anonymousEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('익명 뒷담 메시지')
            .setDescription(`"${content}"`)
            .setTimestamp()
            .setFooter({ text: '범인은 근처에?' });

        // 실시간으로 찾아냈거나 새로 개설한 '익명-뒷담방' 채널에 최종 전송
        await targetChannel.send({ embeds: [anonymousEmbed] });
    },
};