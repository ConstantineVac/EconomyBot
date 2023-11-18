const { ButtonBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'vote',
    description: 'Vote for our bot!',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setTitle('Vote for Our Bot!')
            .setDescription('Click the button below to vote for our bot on top.gg.')
            .setColor('#0099ff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Vote Now')
                    .setStyle(5)
                    .setURL('https://top.gg/bot/your-bot-id/vote')
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    },
};
