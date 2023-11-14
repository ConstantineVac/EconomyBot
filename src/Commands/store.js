// store.js

const { getDatabase } = require('../database');

let itemEmoji = '';

module.exports = {
    name: 'store',
    description: 'Store items in your secondary inventory',
    options: [
        {
            name: 'item',
            description: 'Item to store',
            type: 3, // STRING type
            required: true,
        },
        {
            name: 'quantity',
            description: 'Quantity of the item to store',
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

            // Get the item to store
            const itemName = interaction.options.getString('item');
            const quantity = interaction.options.getInteger('quantity') || 1;
            
            // Find the items in the user's inventory, excluding null entries
            const itemsToMove = user.inventory.filter(item => item && item.name === itemName);
            
            // Check if the user has enough quantity to store
            if (itemsToMove.length < quantity) {
                return interaction.reply({ content: 'Insufficient quantity to store.', ephemeral: true });
            }

            // Filter out null entries in the main inventory
            user.inventory = user.inventory.filter(item => item !== null);

            // Filter out null entries in the secondary inventory
            user.secondaryInventory = user.secondaryInventory.filter(item => item !== null);

            // Check if the user has enough space in the secondary inventory
            if (user.secondaryInventory.length + quantity <= 300) {
                // Move the specified quantity of items to the secondary inventory
                for (let i = 0; i < quantity; i++) {
                    // Find the index of the item in the main inventory
                    const inventoryItemIndex = user.inventory.findIndex(item => item && item.name === itemName);

                    // Check if the item exists in the main inventory
                    if (inventoryItemIndex !== -1) {
                        const inventoryItem = user.inventory[inventoryItemIndex];
                        itemEmoji = inventoryItem.emoji;
                        
                        // Move the item to the secondary inventory
                        user.secondaryInventory.push({ name: inventoryItem.name, id: inventoryItem.id, emoji: inventoryItem.emoji });

                        // Remove the item from the main inventory
                        user.inventory.splice(inventoryItemIndex, 1);
                    } else {
                        // If the item is not found in the main inventory, break the loop
                        break;
                    }
                }

                interaction.reply(`Successfully stored ${quantity} x ${itemEmoji} ${itemName} in your secondary inventory.`);
            } else {
                interaction.reply('Your secondary inventory is full! Please remove some items before storing more.');
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
