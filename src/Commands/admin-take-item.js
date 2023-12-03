const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-take-item',
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
            type: 3, // String type (item name)
            required: true,
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
            // Get the configuration from the database
            const config = await getDatabase().collection('configuration').findOne({ name: 'admin' });

            // Get the admin roles from the configuration
            const adminRoles = config.data.adminRoles;
            
            // Check if the user has any of the admin roles
            const hasRole = interaction.member.roles.cache.some(role => adminRoles.includes(role.id));
            
            if (!hasRole) {
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

            // Remove references to the item from the user's inventory
            for (let i = 0; i < amount; i++) {
                const itemIndex = inventoryToUpdate.findIndex((invItem) => invItem.itemId === item.id);

                if (itemIndex !== -1) {
                    inventoryToUpdate.splice(itemIndex, 1);
                }
            }

            // Update the user in the database
            await getDatabase().collection('users').updateOne(
                { _id: targetUser.id },
                { $set: { [inventoryType]: inventoryToUpdate } }
            );

            interaction.reply(`Successfully took ${amount} x ${item.emoji} ${item.name} from ${targetUser.username}.`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while processing the take-item command.', ephemeral: true });
        }
    },
};
