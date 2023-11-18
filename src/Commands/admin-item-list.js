// admin-item-list.js 

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 10;

module.exports = {
    name: 'admin-item-list',
    description: 'View all available items on the server',
    async execute(interaction, pageNumber = 1) {
        try {

             // Check if the user has the required role (replace ROLE_ID with the actual role ID)
             if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST) && !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)) {
                return interaction.reply('You do not have the required role to use this command.');
            }

            // Retrieve recipes from the database
            const items = await getDatabase().collection('items').find().toArray();
    
            // Check if there are any items
            if (!items || items.length === 0) {
                return interaction.reply('No items available.');
            }
    
            // Calculate the total number of pages
            const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    
            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }
    
            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
    
            // Create an embed to display the available recipes for the current page
            const embed = new EmbedBuilder()
                .setTitle('Items')
                .setColor('DarkGold')
                .setDescription(`Available items (Page ${pageNumber}/${totalPages})`);
    
            // Add each recipe and its ingredients to the embed
            for (let i = startIndex; i < endIndex; i++) {
                const item = items[i];
    
                // Check if the recipe is defined
                if (!item) {
                    continue;
                }
    
                // Extract information from the recipe
                const itemName = item.name;
    
                // Add information to the embed
                embed.addFields({
                    name: `${item.emoji} `,
                    value: `${itemName}`,
                });
            }
    
            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
            .setCustomId(`previousPageAdminItem_${Math.max(1, pageNumber - 1)}`)
            .setLabel('Previous Page')
            .setStyle(4)
            .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
            .setCustomId(`nextPageAdminItem_${pageNumber + 1}`)
            .setLabel('Next Page')
            .setStyle(3)
            .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Create an action row for the buttons
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
            interaction.update({ embeds: [embed], components: [actionRow] });
            } else {
            interaction.reply({ embeds: [embed], components: [actionRow] });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching available recipes.', ephemeral: true });
        }
    }
}