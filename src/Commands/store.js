// store.js

const { getDatabase } = require('../database');

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
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

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

            // Move items to secondary inventory
            for (let i = 0; i < quantity; i++) {

                // Find the index of the item in the secondary inventory, excluding null entries
                const secondaryInventoryItemIndex = user.secondaryInventory.findIndex(item => item && item.id === itemId);

                // If the item is already in the secondary inventory, increase the quantity
                if (secondaryInventoryItemIndex !== -1) {
                    user.secondaryInventory[secondaryInventoryItemIndex].quantity += 1;
                } else {
                    // If the item is not in the secondary inventory, add it
                    user.secondaryInventory.push({ name: itemName, quantity: 1 });
                }

                // Remove the item from the main inventory
                const inventoryItemIndex = user.inventory.findIndex(item => item.name === itemName);
                user.inventory.splice(inventoryItemIndex, 1);
            }

            // Filter out null entries in the main inventory
            user.inventory = user.inventory.filter(item => item !== null);

            // Filter out null entries in the secondary inventory
            user.secondaryInventory = user.secondaryInventory.filter(item => item !== null);

            // Check if the secondary inventory exceeds the limit
            if (user.secondaryInventory.length > 300) {
                return interaction.reply('Your secondary inventory is full! Please remove or move some items.');
            }

            // Update the user's entry in the database
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                { $set: user }
            );

            return interaction.reply(`Successfully stored ${quantity} x ${itemName} in your secondary inventory.`);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },
};
