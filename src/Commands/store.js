// store.js

const { getDatabase } = require('../database');

module.exports = {
    name: 'store',
    description: 'Store items in your secondary inventory',
    options: [
        {
            name: 'items',
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
            const itemId = interaction.options.getString('item');
            const quantity = interaction.options.getInteger('quantity') || 1;
    
            // Find the item in the user's inventory
            const inventoryItemIndex = user.inventory.findIndex(item => item.id === itemId);
    
            // Check if the item is in the inventory
            if (inventoryItemIndex === -1) {
                return interaction.reply({ content: 'Item not found in your inventory.', ephemeral: true });
            }
    
            // Check if the user has enough quantity to store
            if (user.inventory[inventoryItemIndex].quantity < quantity) {
                return interaction.reply({ content: 'Insufficient quantity to store.', ephemeral: true });
            }
    
            // Reduce the quantity in the main inventory
            user.inventory[inventoryItemIndex].quantity -= quantity;
    
            // Find the item in the secondary inventory
            const secondaryInventoryItemIndex = user.secondaryInventory.findIndex(item => item.id === itemId);
    
            // If the item is already in the secondary inventory, increase the quantity
            if (secondaryInventoryItemIndex !== -1) {
                user.secondaryInventory[secondaryInventoryItemIndex].quantity += quantity;
            } else {
                // If the item is not in the secondary inventory, add it
                user.secondaryInventory.push({ id: itemId, name: 'ItemName', quantity });
            }
    
            // Update the user's entry in the database
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                { $set: user }
            );
    
            return interaction.reply(`Successfully stored ${quantity} x ItemName in your secondary inventory.`);
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },    
};
