const { getDatabase } = require('../database');

module.exports = {
    name: 'take-item',
    description: 'Take an item from a user',
    options: [
        {
            name: 'user',
            description: 'Select the user to take the item from',
            type: 6, // User type
            required: true,
        },
        {
            name: 'inventory_type',
            description: 'Select the inventory type',
            type: 3, // String type
            required: true,
            choices: [
                { name: 'Inventory', value: 'inventory' },
                { name: 'Secondary Inventory', value: 'secondaryInventory' },
            ],
        },
        {
            name: 'item',
            description: 'Select the item to take',
            type: 3, // Integer type or 3 if it's a string (item name)
            required: true,
            // choices: [], // Will be dynamically populated IF we could have more than 25
        },
        {
            name: 'amount',
            description: 'Specify the amount of the item to take',
            type: 4, // Integer type
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Check if the user has the required role (replace ROLE_ID with the actual role ID)
            if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE)) {
                return interaction.reply('You do not have the required role to use this command.');
            }

            // Fetch the selected user
            const targetUser = interaction.options.getUser('user');

            // Fetch the selected inventory type
            const inventoryType = interaction.options.getString('inventory_type');

            // Fetch the selected item name
            const itemName = interaction.options.getString('item');

            // Fetch the specified amount
            const amount = interaction.options.getInteger('amount');

            // Fetch the user from the database
            const receiver = await getDatabase().collection('users').findOne({ _id: targetUser.id });

            if (!receiver) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Determine which inventory to update
            const inventoryToUpdate = inventoryType === 'secondaryInventory' ? receiver.secondaryInventory : receiver.inventory;

            // Filter out items with the specified name
            const itemsToRemove = inventoryToUpdate.filter(userItem => userItem.name === itemName);

            if (itemsToRemove.length === 0) {
                return interaction.reply(`The user does not have ${itemName} in their ${inventoryType}.`);
            }

            // Calculate the total amount to take (no more than what's available)
            const totalAmount = Math.min(amount, itemsToRemove.length);

            // Check if the specified amount is greater than the length
            if (amount > itemsToRemove.length) {
                return interaction.reply(`The specified amount is greater than the available ${itemName}s in the ${inventoryType}.`);
            }

            // Remove the specified amount of items from the user's inventory
            for (let i = 0; i < totalAmount; i++) {
                const indexToRemove = inventoryToUpdate.indexOf(itemsToRemove[i]);
                inventoryToUpdate.splice(indexToRemove, 1);
            }

            // Update the user in the database
            await getDatabase().collection('users').updateOne(
                { _id: targetUser.id },
                { $set: { [inventoryType]: inventoryToUpdate } }
            );

            interaction.reply(`Successfully took ${totalAmount} x ${itemName} from ${targetUser.username}.`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while processing the take-item command.', ephemeral: true });
        }
    },
};
