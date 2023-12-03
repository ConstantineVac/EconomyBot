const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-edit-shop',
    description: 'Edit an existing shop',
    options: [
        {
            name: 'shop_name',
            type: 3, // String type
            description: 'Name of the shop to edit',
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'new_shop_name',
            type: 3,
            description: 'New name for the shop',
            required: false,
        },
        {
            name: 'new_shop_owner',
            type: 6,
            description: 'New shop owner',
            required: false,
        },
        {
            name: 'new_description',
            type: 3,
            description: 'New description for the shop',
            required: false,
        },
        {
            name: 'new_emoji',
            type: 3,
            description: 'New emoji for the shop',
            required: false,
        },
    ],
    autocomplete: async function (interaction) {
        try {
            // Get the user's input
            const userInput = interaction.options.getString('shop_name');

            // Fetch the items from the database that match the user's input
            const shops = await getDatabase().collection('shop').find({ shop_name: { $regex: userInput, $options: 'i' } }).toArray();
            //console.log(shops)
            // Map the items to the format needed for choices
            const choicesShops = shops.map(shop => ({ name: shop.shop_name, value: shop.shop_name }));

            // Respond with the choices
            await interaction.respond(choicesShops.slice(0, 25));
        } catch (error) {
            console.error(error);
            await interaction.respond({ content: 'An error occurred while fetching shop choices.', ephemeral: true });
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
            const newShopName = interaction.options.getString('new_shop_name');
            const newShopOwner = interaction.options.getUser('new_shop_owner');
            const newDescription = interaction.options.getString('new_description');
            const newEmoji = interaction.options.getString('new_emoji');

            // Find the shop in the database based on the provided name
            const existingShop = await getDatabase().collection('shop').findOne({ shop_name: shopName });

            // Check if the shop exists
            if (!existingShop) {
                return interaction.reply({ content: `Shop "${shopName}" not found.`, ephemeral: true });
            }

            // Check if the newShopName already exists in the database
            if (newShopName) {
                const shopWithNewName = await getDatabase().collection('shop').findOne({ shop_name: newShopName });

                if (shopWithNewName) {
                    return interaction.reply({ content: `Shop "${newShopName}" already exists. Please choose a different name.`, ephemeral: true });
                }
            }

            // Update the shop details if new values are provided
            if (newShopName) {
                existingShop.shop_name = newShopName;
            }
            if (newShopOwner) {
                existingShop.owner = newShopOwner;
            }
            if (newDescription) {
                existingShop.description = newDescription;
            }
            if (newEmoji) {
                existingShop.emoji = newEmoji;
            }

            // Update the shop in the 'shop' collection in the database
            await getDatabase().collection('shop').updateOne({ shop_name: shopName }, { $set: existingShop });

            interaction.reply({ content: `Shop "${shopName}" updated successfully!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while editing the shop.', ephemeral: true });
        }
    },
};
