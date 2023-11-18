const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'shop',
    description: 'View items available in the shop',
    async execute(interaction, pageNumber = 1) {
        try {
            // Retrieve shop items from the database
            const shopItems = await getDatabase().collection('shop').find().toArray();

            if (shopItems.length === 0) {
                return interaction.reply('The shop is currently empty. Check back later!');
            }

            // Calculate the total number of pages
            const totalPages = Math.ceil(shopItems.length / ITEMS_PER_PAGE);

            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, shopItems.length);

            const embed = new EmbedBuilder()
                .setTitle('🏪 Shop')
                .setThumbnail('https://i.postimg.cc/g2X1Qfkq/shop.png')
                .setColor('DarkRed')
                .setDescription(`Available items in the shop (Page ${pageNumber}/${totalPages})`);

            const itemsRow = new ActionRowBuilder();
            const navigationRow = new ActionRowBuilder();

            for (let i = startIndex; i < endIndex; i++) {
                const item = shopItems[i];

                embed.addFields({
                    name: `${item.emoji} **${item.name}** - 🪙 **${item.price}** coins`,
                    value: ` Quantity: 1pcs`
                });

                const button = new ButtonBuilder()
                    .setCustomId(`${item.id}`)
                    .setLabel(`🛒 ${item.name}`)
                    .setStyle(3);

                itemsRow.addComponents(button);
                //console.log(button)
            }

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
                .setCustomId(`previousPageShop_${Math.max(1, pageNumber - 1)}`)
                .setLabel('Previous Page')
                .setStyle(4)
                .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
                .setCustomId(`nextPageShop_${pageNumber + 1}`)
                .setLabel('Next Page')
                .setStyle(3)
                .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Add pagination buttons to the row
            navigationRow.addComponents(previousButton, nextButton);

            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
                interaction.update({ embeds: [embed], components: [itemsRow, navigationRow] });
            } else {
                interaction.reply({ embeds: [embed], components: [itemsRow, navigationRow] });
            }
            
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching the shop items.', ephemeral: true });
        }
    },
};