const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-manage-shop',
    description: 'Manage items in a shop',
    options: [
        {
            name: 'shop_name',
            type: 3,
            description: 'Name of the shop to manage',
            required: true,
        },
        {
            name: 'action',
            type: 3,
            description: 'Action to perform (add_item, remove_item)',
            required: true,
            choices: [
                {
                    name: '➕ Add Item',
                    value: 'add_item',
                },
                {
                    name: '➖Remove Item',
                    value: 'remove_item',
                },
            ],
        },
        {
            name: 'item_name',
            type: 3,
            description: 'Name of the item to add or remove',
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Ensure that the command is being used by an admin (customize as needed)
            if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) &&
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2) &&
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            // Extract details from the user's input
            const shopName = interaction.options.getString('shop_name');
            const action = interaction.options.getString('action');
            const itemName = interaction.options.getString('item_name');

            // Find the shop in the 'shop' collection based on the provided name
            const existingShop = await getDatabase().collection('shop').findOne({ shop_name: shopName });

            // Check if the shop exists
            if (!existingShop) {
                return interaction.reply({ content: `Shop "${shopName}" not found.`, ephemeral: true });
            }

            // Find the item in the 'items' collection based on the provided name
            const existingItem = await getDatabase().collection('items').findOne({ name: itemName });

            // Perform the specified action
            if (action === 'add_item') {
                // Check if the item exists in the 'items' collection
                if (!existingItem) {
                    return interaction.reply({ content: `Item "${itemName}" not found. Cannot add non-existent item.`, ephemeral: true });
                }

                // Check if the item is already in the shop
                if (existingShop.items.some(item => item.name === existingItem.name)) {
                    return interaction.reply({ content: `Item "${itemName}" is already in the shop.`, ephemeral: true });
                }

                // Add the entire item object to the shop
                existingShop.items.push(existingItem);
            } else if (action === 'remove_item') {
                // Check if the item is in the shop
                if (!existingShop.items.some(item => item.name === itemName)) {
                    return interaction.reply({ content: `Item "${itemName}" is not in the shop.`, ephemeral: true });
                }

                // Remove the item from the shop
                existingShop.items = existingShop.items.filter(item => item.name !== itemName);
            } else {
                return interaction.reply({ content: 'Invalid action. Use "add_item" or "remove_item".', ephemeral: true });
            }

            // Update the shop in the 'shop' collection in the database
            await getDatabase().collection('shop').updateOne({ shop_name: shopName }, { $set: existingShop });

            interaction.reply({ content: `Shop "${shopName}" updated successfully!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while managing the shop.', ephemeral: true });
        }
    },
};
