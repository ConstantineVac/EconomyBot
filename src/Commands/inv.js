// inv.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'inv',
    description: 'View your inventory',
    async execute(interaction) {
        try {
            // Initialize itemCounts for each execution
            const itemCounts = {};

            // Retrieve user's inventory from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Check if the user has items in the inventory
            if (!user.inventory || user.inventory.length === 0) {
                return interaction.reply('Your inventory is empty.');
            }

            // Count the occurrences of each item in the inventory
            user.inventory.forEach(inventoryItem => {
                const itemName = inventoryItem.name;
                itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
            });

            // Calculate the total number of pages
            const totalPages = Math.ceil(Object.keys(itemCounts).length / ITEMS_PER_PAGE);

            // Retrieve the page number from the interaction (default to 1 if not provided)
            const pageNumber = parseInt(interaction.options.getString('page')) || 1;

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, Object.keys(itemCounts).length);

            // Create an embed to display the user's inventory for the current page
            const embed = new EmbedBuilder()
                .setTitle('Inventory')
                .setDescription(`Items in your inventory (Page ${pageNumber}/${totalPages})`);

            // Add each item and its count to the embed
            for (let i = startIndex; i < endIndex; i++) {
                const itemName = Object.keys(itemCounts)[i];
                embed.addFields({
                    name: `Item: **${itemName}**`,
                    value: `Quantity: **${itemCounts[itemName]}**`,
                });
            }

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
                .setCustomId('previousPage')
                .setLabel('Previous Page')
                .setStyle(1);

            const nextButton = new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('Next Page')
                .setStyle(1);

            // Create an action row for the buttons
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            interaction.reply({ embeds: [embed], components: [actionRow] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching your inventory.', ephemeral: true });
        }
    },
};
