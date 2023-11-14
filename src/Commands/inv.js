// inv.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'inv',
    description: 'View your inventory',
    async execute(interaction, pageNumber = 1) {
        try {
            // Initialize itemCounts for each execution
            const itemCounts = {};

            // Retrieve user's inventory from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Filter out null entries in the inventory
            const validInventory = user.inventory.filter(item => item !== null && item.name);

            // Check if the user has items in the inventory
            if (!validInventory || validInventory.length === 0) {
                return interaction.reply('Your inventory is empty.');
            }

            // Count the occurrences of each item in the inventory
            validInventory.forEach(inventoryItem => {
                const itemName = inventoryItem.name;
                itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
            });

            // Calculate the total number of pages
            const totalPages = Math.ceil(Object.keys(itemCounts).length / ITEMS_PER_PAGE);
            
            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, Object.keys(itemCounts).length);

            // Create an embed to display the user's inventory for the current page
            const embed = new EmbedBuilder()
                .setTitle('🎒Inventory')
                .setColor('Green')
                .setDescription(`Items in your inventory (Page ${pageNumber}/${totalPages})`);

            // Add each item and its count to the embed
            let itemNumber = (pageNumber - 1) * ITEMS_PER_PAGE + 1;
            for (let i = startIndex; i < endIndex; i++) {
                const itemName = Object.keys(itemCounts)[i];
                const itemCount = itemCounts[itemName];

                // Retrieve the item from the inventory to get the emoji
                const item = validInventory.find(item => item.name === itemName);

                // Check if itemName, itemCount, and item are defined
                if (itemName && itemCount !== undefined && item) {
                    embed.addFields({
                        name: `${item.emoji} ${itemNumber}. **${itemName}**`,
                        value: `Quantity: **${itemCount}**`,
                    });
                    itemNumber++;
                }
            }

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
            .setCustomId(`previousPageInv_${Math.max(1, pageNumber - 1)}`)
            .setLabel('Previous Page')
            .setStyle(4)
            .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
            .setCustomId(`nextPageInv_${pageNumber + 1}`)
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
            interaction.reply({ content: 'There was an error fetching your inventory.', ephemeral: true });
        }
    },
};
