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
            choices: [],
            autocomplete: true,
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
            choices: [],
            autocomplete: true,
        },
    ],
    async autocomplete(interaction) {
        try {
            if (!interaction.isAutocomplete()) return;
    
            const focusedOption = interaction.options.getFocused(true);
            let choices;
    
            if (focusedOption.name === 'shop_name') {
                // Your logic for handling shop_name autocomplete
                const userInput = focusedOption.value;
                const shops = await getDatabase().collection('shop').find({ shop_name: { $regex: userInput, $options: 'i' } }).toArray();
                choices = shops.map(shop => ({ name: shop.shop_name, value: shop.shop_name }));
            }
    
            if (focusedOption.name === 'item_name') {
                // Your logic for handling item_name autocomplete
                const userInput = focusedOption.value;
                const items = await getDatabase().collection('items').find({ name: { $regex: userInput, $options: 'i' } }).toArray();
                choices = items.map(item => ({ name: item.name, value: item.name }));
            }
    
            const filtered = choices.filter(choice => choice.name.startsWith(focusedOption.value));
            await interaction.respond( filtered.slice(0, 25));
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while fetching choices.', ephemeral: true });
        }
    },
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
