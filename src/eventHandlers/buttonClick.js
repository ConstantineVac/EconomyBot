// eventHandlers/buttonClick.js
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, MessageCollector } = require('discord.js');

const { getDatabase } = require('../database');

module.exports = async (interaction) => {
    // Extract action and new page number from the button custom id
    
    console.log(`Custom ID : ${interaction.customId}`)
    let [action, newPage, targetUser , inventoryType] = interaction.customId.split('_');
    console.log([action,  newPage, targetUser, inventoryType]);
    if (action === 'previousPageRec' || action === 'nextPageRec') {
        // Call the 'recipe' command with the new page number
        interaction.client.commands.get('recipe').execute(interaction, targetUser, inventoryType, parseInt(newPage));

    } else if (action === 'previousPageInv' || action === 'nextPageInv') {
        // Call the 'inv' command with the new page number
        interaction.client.commands.get('inv').execute(interaction, parseInt(newPage));

    } else if (action.startsWith('previousAd') || action.startsWith('nextAd')) {
        interaction.client.commands.get('admin-check').execute(interaction, parseInt(newPage));

    } else if (action.startsWith('showBalance')){
        const [, targetUser] = interaction.customId.split('_');
        const user = await getDatabase().collection('users').findOne({ _id: targetUser });
        //console.log(user)
             
        // Load data for each category from the info collection
        const categories = ['cash', 'bank', 'stash', 'balance', 'currentJob'];
        const categoryData = {};

        for (const category of categories) {
            const categoryInfo = await getDatabase().collection('info').findOne({ name: category });
            categoryData[category] = categoryInfo?.data || {};
        }
        // Format the money for better readability
        const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const formattedStash = user.stash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        // Create an embed to display the user's balance
        const embed = new EmbedBuilder()
            .setTitle('Admin Account Inspection')
            .setDescription(`For User: ${user.username}`)
            .setThumbnail(`${categoryData.balance.url}`)
            .setColor('DarkRed')
            .addFields(
                { name: `${categoryData.cash?.emoji} ${categoryData.cash?.name}`, value: formattedCash || '0', inline: true },
                { name: `${categoryData.bank?.emoji} ${categoryData.bank?.name}`, value: formattedBank || '0', inline: true },
                { name: `${categoryData.stash?.emoji} ${categoryData.stash?.name}`, value: formattedStash || '0', inline: true },
                { name: `${categoryData.currentJob?.emoji} ${categoryData.currentJob?.name}`, value: user.currentJob ? user.currentJob.name : 'Unemployed', inline: true },
            );

        // Send the embed as a reply
        interaction.reply({ embeds: [embed], ephemeral: true });
        
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
        const shop = shopItem.store;
        //console.log(`Shop name : ${shop}`)
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
                // Retrieve the shop from the 'shop' collection
                const existingShop = await getDatabase().collection('shop').findOne({ shop_name: shop });
                //console.log(`Existing Shop : ${existingShop}`)

                if (!existingShop) {
                    console.log(`Shop not found.`);
                    return interaction.reply({ content: 'Shop not found.', ephemeral: true });
                }

                // Retrieve the shop owner from the 'users' collection
                let shopOwner;

                if (existingShop.owner && existingShop.owner.id) {
                    shopOwner = await getDatabase().collection('users').findOne({ _id: existingShop.owner.id });
                    //console.log(`ShopOwner : ${shopOwner._id}`)
                }

                // Process the user's response and continue with your logic
                // Deduct price from user's balance and add item to user's inventory
                if (userBalance >= itemPrice * quantity) {
                    const totalPurchasePrice = itemPrice * quantity;

                    // Calculate the amount to award to the shop owner (100% of total purchase price)
                    const ownerReward =  totalPurchasePrice;

                    // Update the user's balance and add the item to the inventory
                    await getDatabase().collection('users').updateOne(
                        { _id: interaction.user.id },
                        {
                            $inc: { bank: -totalPurchasePrice },
                            $push: {
                                inventory: {
                                    $each: Array.from({ length: quantity }, () => ({ itemId: itemId })),
                                    $position: 0 // Add the new items to the beginning of the array
                                }
                            }
                        }
                    );

                    // Award the shop owner if it's not an empty object
                    if (shopOwner && Object.keys(shopOwner).length > 0) {
                        await getDatabase().collection('users').updateOne(
                            { _id: shopOwner._id },
                            { $inc: { bank: ownerReward } }
                        );

                        // Notify the user of the purchase receipt and the shop owner's reward
                        interaction.followUp(`Your purchase receipt: ${totalPurchasePrice.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        })}. Thank you 🎊`);
                        interaction.followUp(`The shop owner, ${shopOwner.username}, has been awarded ${ownerReward.toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        })}.`);
                    } else {
                        // Notify the user of the purchase receipt without awarding the shop owner
                        interaction.followUp(`You have successfully purchased ${quantity} x ${shopItem.emoji} ${shopItem.name}!`);
                    }

                    // Delete the user's message
                    message.delete().catch(console.error);
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
