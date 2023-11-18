// eventHandlers/buttonClick.js
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const { getDatabase } = require('../database');

module.exports = async (interaction) => {
    // Extract action and new page number from the button custom id
    const [action, newPage] = interaction.customId.split('_');
    
    if (action === 'previousPageRec' || action === 'nextPageRec') {
        // Call the 'recipe' command with the new page number
        interaction.client.commands.get('recipe').execute(interaction, parseInt(newPage));

    } else if (action === 'previousPageInv' || action === 'nextPageInv') {
        // Call the 'inv' command with the new page number
        interaction.client.commands.get('inv').execute(interaction, parseInt(newPage));

    } else if (action === 'previousPageChest' || action === 'nextPageChest')       {
        // Call the 'chest' command with the new page number
        interaction.client.commands.get('chest').execute(interaction, parseInt(newPage));

    } else if (action === 'previousPageShop' || action === 'nextPageShop') {    
        // Call the 'chest' command with the new page number
        interaction.client.commands.get('shop').execute(interaction, parseInt(newPage));

    } else if (action === 'previousPageAdminItem' || action === 'nextPageAdminItem') {
        // Call the 'admin-item-list' command with the new page number
        interaction.client.commands.get('admin-item-list').execute(interaction, parseInt(newPage)); 

    } else {
        // Extract item id from the button custom id
        const itemId = Number(interaction.customId); // Convert to number

        // Retrieve user balance and item price from the database
        const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

        // Check if the user exists
        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        // Retrieve the item from the shop collection using the correct field name
        const shopItem = await getDatabase().collection('shop').findOne({ id: itemId });

        // Check if the item exists
        if (!shopItem) {
            return interaction.reply({ content: 'Item not found in the shop.', ephemeral: true });
        }
        const userBalance = user.bank;
        const itemPrice = shopItem.price;
        const itemEmoji = shopItem.emoji;

        const userInventory = user.inventory || [];

        // Filter out null positions in the inventory
        const filteredInventory = userInventory.filter(item => item);

        // Check if the user's filtered inventory exceeds the limit
        if (filteredInventory.length >= 200) {
            return interaction.reply('Your inventory is full! Please store some items in your secondary inventory or discard them.');
        }

        if (userBalance >= itemPrice) {
            // Deduct price from user's balance and add item to user's inventory
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                { 
                    $inc: { bank: -itemPrice },
                    $push: {
                        inventory: {
                            $each: [{ id: itemId, name: shopItem.name, emoji: shopItem.emoji }],
                            $position: 0 // Add the new item to the beginning of the array
                        }
                    }
                }
            );

            interaction.reply(`You have successfully purchased 1 x ${shopItem.emoji} ${shopItem.name}!`);
        } else {
            interaction.reply('You do not have enough coins to purchase this item.');
        }
    }
};
