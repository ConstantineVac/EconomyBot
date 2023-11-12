// shop.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'shop',
    description: 'View items available in the shop',
    async execute(interaction) {
        try {
            // Retrieve shop items from the database
            const shopItems = await getDatabase().collection('shop').find().toArray();
            //console.log(shopItems);
            if (shopItems.length === 0) {
                return interaction.reply('The shop is currently empty. Check back later!');
            }

            const embed = new EmbedBuilder()
                .setTitle('🏪 Shop')
                .setColor('DarkRed')
                .setDescription('Available items in the shop');

            const buttonsRow = new ActionRowBuilder();

            shopItems.forEach(item => {
                embed.addFields({
                    name: `${item.emoji} **${item.name}** - **${item.price}** coins`,
                    value: `ID: ${item.id}`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(`${item.id}`)
                    .setLabel(`🛒 ${item.name}`)
                    .setStyle(3); 

                buttonsRow.addComponents(button);
            });

            interaction.reply({ embeds: [embed], components: [buttonsRow] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching the shop items.', ephemeral: true });
        }
    },
};
