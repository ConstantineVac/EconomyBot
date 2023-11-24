const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-create-shop',
    description: 'Create a new shop',
    options: [
        {
            name: 'shop_name',
            type: 3,
            description: 'Name of the shop',
            required: true,
        },
        {
            name: 'description',
            type: 3,
            description: 'Description of the shop',
            required: false,
        },
        {
            name: 'emoji',
            type: 3,
            description: 'Emoji for the shop',
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

            // Extract shop details from the user's input
            const shopName = interaction.options.getString('shop_name');
            const description = interaction.options.getString('description');
            const emoji = interaction.options.getString('emoji');

            // Find the highest current id in the collection
            const highestIdShop = await getDatabase().collection('shop').findOne({}, { sort: { id: -1 } });

            // Calculate the new id (increment by 1)
            const newId = highestIdShop ? highestIdShop.id + 1 : 1;

            // Create a new shop object
            const newShop = {
                id: newId,
                shop_name: shopName,
                description: description || '',
                emoji: emoji || '',
                items: [], // Initialize with an empty array of items
            };

            // Add the new shop to the 'shop' collection in the database
            await getDatabase().collection('shop').insertOne(newShop);

            interaction.reply({ content: `Shop "${shopName}" created successfully!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while creating the shop.', ephemeral: true });
        }
    },
};
