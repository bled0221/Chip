const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    // 1. 메뉴판 정의 (유저에게 항목들을 입력받을 거야)
    data: new SlashCommandBuilder()
        .setName('랜덤')
        .setDescription('입력한 항목들 중 랜덤으로 하나를 선택합니다.')
        .addStringOption(option =>
            option.setName('항목')
                .setDescription('원하는 항목들을 띄어쓰기로 구분해서 적어주세요. (예: 짜장면 짬뽕 탕수육)')
                .setRequired(true)
        ),

    // 2. 실제 골라주는 능력 알맹육
    async execute(interaction) {
        // 유저가 입력한 글자 가져오기 (예: "짜장면 짬뽕 탕수육")
        const input = interaction.options.getString('항목');

        // 띄어쓰기를 기준으로 단어들을 쪼개서 배열(바구니)로 만들기
        // 예: ["짜장면", "짬뽕", "탕수육"]
        const choices = input.split(' ').filter(choice => choice.trim() !== '');

        // 만약 유저가 띄어쓰기 없이 단어 하나만 적었을 경우 방어 코드
        if (choices.length < 2) {
            return interaction.reply({ 
                content: '⚠️ 최소 2개 이상의 항목을 입력해 주세요! (예: `/랜덤 항목: 짜장면 짬뽕`)', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // 🎲 수학 마법(Math.random)으로 배열에서 랜덤하게 하나 뽑기
        const picked = choices[Math.floor(Math.random() * choices.length)];

        // 이 결과는 친구들도 다 같이 봐야 하니까 ephemeral 옵션 없이 모두에게 공개!
        await interaction.reply({ 
            content: `**칩**의 선택은 바로... \n\n**${picked}** 입니다!` 
        });
    },
}; 