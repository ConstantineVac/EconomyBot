const { getDatabase } = require('../database');

module.exports = {
    name: 'give-item',
    description: 'Give an item to a user',
    options: [
        {
            name: 'user',
            description: 'Select the user to give the item to',
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
            description: 'Select the item to give',
            type: 3, // Integer type or 3 if it's a string (item name)
            required: true,
            //choices: [], // Will be dynamically populated IF we could have more than 25
        },
        {
            name: 'amount',
            description: 'Specify the amount of the item to give',
            type: 4, // Integer type
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Check if the user has the required role (replace ROLE_ID with the actual role ID)
            if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) && 
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2) && 
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)) {
                return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
            }

            // Fetch the selected user
            const targetUser = interaction.options.getUser('user');

            // Fetch the selected inventory type
            const inventoryType = interaction.options.getString('inventory_type');

            // Fetch the selected item name
            const itemName = interaction.options.getString('item');

            // Fetch the specified amount
            const amount = interaction.options.getInteger('amount');

            // Check if the amount is non-negative
            if (amount <= 0) {
                return interaction.reply({ content: 'Amount must be a positive integer.', ephemeral: true });
            }

            // Fetch the item from the items collection
            const item = await getDatabase().collection('items').findOne({ 'name': itemName });

            if (!item) {
                return interaction.reply({ content: 'Invalid item name.', ephemeral: true });
            }

            // Fetch the user from the database
            const receiver = await getDatabase().collection('users').findOne({ _id: targetUser.id });

            if (!receiver) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Determine which inventory to update
            const inventoryToUpdate = inventoryType === 'secondaryInventory' ? receiver.secondaryInventory : receiver.inventory;

            // Add the item to the user's inventory multiple times
            for (let i = 0; i < amount; i++) {
                inventoryToUpdate.push({ id: item.id, name: item.name, emoji: item.emoji});
            }
            
            // Update the user in the database
            await getDatabase().collection('users').updateOne(
                { _id: targetUser.id },
                { $set: { [inventoryType]: inventoryToUpdate } }
            );

            interaction.reply(`Successfully gave ${amount} x ${item.emoji} ${item.name} to ${targetUser.username}.`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while processing the give-item command.', ephemeral: true });
        }
    },
};
