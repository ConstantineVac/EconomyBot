// retrieve.js

const { getDatabase } = require('../database');

module.exports = {
    name: 'retrieve',
    description: 'Retrieve items from your secondary inventory',
    options: [
        {
            name: 'item',
            description: 'Item to retrieve',
            type: 4, // STRING type
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
            // Extract options from the interaction
            const itemName = interaction.options.getString('item');
            const quantity = interaction.options.getInteger('quantity');

            // Check if the quantity is valid
            if (!quantity || quantity <= 0) {
                return interaction.reply({ content: 'Please provide a valid quantity.', ephemeral: true });
            }

            // Retrieve user information from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Log the user's inventories for debugging
            console.log('Main Inventory:', user.inventory);
            console.log('Secondary Inventory:', user.secondaryInventory);

            // Check if the user has the item in their secondary inventory
            const secondaryInventoryItem = user.secondaryInventory.find(item => item.name === itemName);

            if (!secondaryInventoryItem || secondaryInventoryItem.quantity < quantity) {
                return interaction.reply({ content: 'You do not have enough of that item in your secondary inventory.', ephemeral: true });
            }

            // Calculate the total quantity of the item in the main inventory
            const mainInventoryItem = user.inventory.find(item => item.name === itemName);
            const totalQuantity = (mainInventoryItem ? mainInventoryItem.quantity : 0) + quantity;

            // Check if the main inventory has enough space
            if (totalQuantity > 200) {
                return interaction.reply({ content: 'Your main inventory is full. Cannot retrieve more of that item.', ephemeral: true });
            }

            // Update user's main and secondary inventories in the database
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                {
                    $pull: { secondaryInventory: { name: itemName } }, // Remove the item from the secondary inventory
                    $push: { inventory: { id: secondaryInventoryItem.id, name: itemName} }, // Add the item to the main inventory
                }
            );

            interaction.reply(`You retrieved ${quantity} ${itemName}(s) from your secondary inventory.`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },
};
