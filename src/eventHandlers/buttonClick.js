// eventHandlers/buttonClick.js
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, MessageCollector } = require('discord.js');

const { getDatabase } = require('../database');

module.exports = async (interaction) => {
    // Extract action and new page number from the button custom id
    const [action, newPage] = interaction.customId.split('_');
    console.log([action, newPage]);
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
        
    } else if (action === 'previousServer' || action === 'nextServer') {
        // // Check if options is defined before trying to access its properties
        // const specifiedChannel = interaction.options && interaction.options.getChannel('channel');
        interaction.client.commands.get('owner-server-report').execute(interaction, parseInt(newPage));

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
        const shopItem = await getDatabase().collection('items').findOne({ id: itemId });

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

        // Prompt user to choose quantity.
        await interaction.reply({ content: 'Choose quantity:', ephemeral: true });

        // Create a filter to collect messages from the user who initiated the interaction
        const filter = (msg) => msg.author.id === interaction.user.id;

        // Create a message collector
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000 }); // Set a time limit, e.g., 30 seconds

        // Listen for messages
        collector.on('collect', async (message) => {
            // Check if the collected message is a number
            const quantity = parseInt(message.content);

            // Check if the quantity is a valid number
            if (!isNaN(quantity) && quantity > 0) {
                // Process the user's response and continue with your logic
                // Deduct price from user's balance and add item to user's inventory
                if (userBalance >= itemPrice * quantity) {
                    await getDatabase().collection('users').updateOne(
                        { _id: interaction.user.id },
                        { 
                            $inc: { bank: -itemPrice * quantity },
                            $push: {
                                inventory: {
                                    $each: Array.from({ length: quantity }, () => ({ id: itemId, name: shopItem.name, emoji: shopItem.emoji })),
                                    $position: 0 // Add the new items to the beginning of the array
                                }
                            }
                        }
                    );
                    
                    let total = itemPrice * quantity;

                    interaction.followUp(`You have successfully purchased ${quantity} x ${shopItem.emoji} ${shopItem.name}!`);
                    // Delete the user's message
                    message.delete().catch(console.error);
                    interaction.followUp(`Your purchase receipt ${total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. Thank you 🎊`)
                } else {
                    interaction.followUp('You do not have enough money to purchase this item.');
                }

                // Stop the collector since we've collected the response
                collector.stop();
            } else {
                // Inform the user that the input is invalid
                interaction.followUp('Invalid quantity. Please enter a valid number greater than 0.');
            }
        });

        // Handle collector end event (e.g., if the time limit is reached)
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.followUp('Time limit exceeded. Please try again.');
            }
        });
    }
};
