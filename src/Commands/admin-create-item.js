// admin-create-item.js

const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-create-item',
    description: 'Create a new item for the economy bot.',
    options: [
        {
            name: 'new_name',
            description: 'Enter the new name for the item',
            type: 3, // String type
            required: true,
        },
        {
            name: 'new_emoji',
            description: 'Enter the new emoji for the item',
            type: 3, // String type
            required: true,
        },
        {
            name: 'price',
            description: 'Enter the new price for the item',
            type: 10, // Integer type
            required: true,
        },
        {
            name: 'store',
            description: 'Enter the new store for the item',
            type: 3, // String type
            required: true,
        },
        {
            name: 'is_for_sale',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'Usable ✅', value: 'true' },
                { name: 'Discardable ❌', value: 'false' },
            ],
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Check if the user has the required role (replace ROLE_ID with the actual role ID)
            if (
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) &&
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2) &&
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)
            ) {
                return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
            }

            // Retrieve user inputs
            const newName = interaction.options.getString('new_name');
            const newEmoji = interaction.options.getString('new_emoji');
            const newPrice = interaction.options.getNumber('price');
            const newStore = interaction.options.getString('store');
            const isForSale = interaction.options.getString('is_for_sale');

            // Check whether the item already exists in the database
            const existingItem = await getDatabase().collection('items').findOne({ name: newName });
            if (existingItem) {
                return interaction.reply({ content: 'An item with the same name already exists.', ephemeral: true });
            }

            // Find the highest current id in the collection
            const highestIdItem = await getDatabase().collection('items').findOne({}, { sort: { id: -1 } });

            // Calculate the new id (increment by 1)
            const newId = highestIdItem ? highestIdItem.id + 1 : 1;

            // Add new item to the database
            await getDatabase().collection('items').insertOne({
                id: newId,
                name: newName,
                emoji: newEmoji,
                price: newPrice,
                store: newStore,
                isForSale: Boolean(isForSale),
            });

            // Create an embed to display the changes
            const embed = new EmbedBuilder()
                .setTitle('✅ Item Created')
                .setColor('Green')
                .setDescription(`Created the item: ${newName}`)
                .addFields(
                    { name: 'Name', value: newName.toString(), inline: true },
                    { name: 'Emoji', value: newEmoji.toString(), inline: true },
                    { name: 'Price', value: newPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }), inline: true },
                    { name: 'Store', value: newStore.toString(), inline: true },
                    { name: 'Is For Sale', value: isForSale.toString(), inline: true }
                );

            interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while creating the item.', ephemeral: true });
        }
    },
};
