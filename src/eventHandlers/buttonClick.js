// eventHandlers/buttonClick.js

const { getDatabase } = require('../database');

module.exports = async (interaction) => {
    // Extract action and item id from the button custom id
    const [action, itemId] = interaction.customId.split('_');

    if (action === 'previousPage' || action === 'nextPage') {
        if (action === 'previousPage') {
            console.log('previous button click')
        } else {
            console.log('next button click')
        }
    } else {
        // Extract item id from the button custom id by removing "purchase_"
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
                            $each: [{ id: itemId, name: shopItem.name }],
                            $position: 0 // Add the new item to the beginning of the array
                        }
                    }
                }
            );

            interaction.reply(`You have successfully purchased 1 x ${shopItem.name}!`);
        } else {
            interaction.reply('You do not have enough coins to purchase this item.');
        }

    }
};

