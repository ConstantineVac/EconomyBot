// retrieve.js

const { getDatabase } = require('../database');

let itemEmoji = '';

module.exports = {
    name: 'retrieve',
    description: 'Retrieve items from your secondary inventory',
    options: [
        {
            name: 'item',
            description: 'Item to retrieve',
            type: 3, // STRING type
            required: true,
        },
        {
            name: 'quantity',
            description: 'Quantity of the item to retrieve',
            type: 4, // INTEGER type
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Retrieve user information from the database
            let user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Initialize secondaryInventory if it doesn't exist
            if (!user.secondaryInventory) {
                user.secondaryInventory = [];
            }

            // Get the item to retrieve
            const itemName = interaction.options.getString('item');
            const quantity = interaction.options.getInteger('quantity') || 1;

            // Find the items in the user's secondary inventory, excluding null entries
            const itemsToRetrieve = user.secondaryInventory.filter(item => item && item.name === itemName);

            // Check if the user has enough quantity to retrieve
            if (itemsToRetrieve.length < quantity) {
                return interaction.reply({ content: 'Insufficient quantity to retrieve.', ephemeral: true });
            }

            // Filter out null entries in the main inventory
            user.inventory = user.inventory.filter(item => item !== null);

            // Filter out null entries in the secondary inventory
            user.secondaryInventory = user.secondaryInventory.filter(item => item !== null);

            // Check if the user has enough space in the main inventory
            if (user.inventory.length + quantity <= 200) {
                // Retrieve the specified quantity of items from the secondary inventory
                for (let i = 0; i < quantity; i++) {
                    // Find the index of the item in the secondary inventory
                    const secondaryInventoryItemIndex = user.secondaryInventory.findIndex(item => item && item.name === itemName);

                    // Check if the item exists in the secondary inventory
                    if (secondaryInventoryItemIndex !== -1) {
                        const secondaryInventoryItem = user.secondaryInventory[secondaryInventoryItemIndex];
                        itemEmoji = secondaryInventoryItem.emoji;

                        // Move the item to the main inventory
                        user.inventory.push({ name: secondaryInventoryItem.name, id: secondaryInventoryItem.id, emoji: secondaryInventoryItem.emoji });

                        // Remove the item from the secondary inventory
                        user.secondaryInventory.splice(secondaryInventoryItemIndex, 1);
                    } else {
                        // If the item is not found in the secondary inventory, break the loop
                        break;
                    }
                }

                interaction.reply(`Successfully retrieved ${quantity} x ${itemEmoji} ${itemName} to your main inventory.`);
            } else {
                interaction.reply('Your main inventory is full! Please remove some items before retrieving more.');
            }

            // Update the user's entry in the database
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                { $set: user }
            );
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },
};
