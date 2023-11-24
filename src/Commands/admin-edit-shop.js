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
        },
        {
            name: 'new_shop_name',
            type: 3,
            description: 'New name for the shop',
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
            const newShopName = interaction.options.getString('new_shop_name');
            const newDescription = interaction.options.getString('new_description');
            const newEmoji = interaction.options.getString('new_emoji');

            // Find the shop in the database based on the provided name
            const existingShop = await getDatabase().collection('shop').findOne({ shop_name: shopName });

            // Check if the shop exists
            if (!existingShop) {
                return interaction.reply({ content: `Shop "${shopName}" not found.`, ephemeral: true });
            }

            // Update the shop details if new values are provided
            if (newShopName) {
                existingShop.shop_name = newShopName;
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
