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
            name: 'is_for_sale',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'For Sale ✅', value: 'true' },
                { name: 'Not for sale ❌', value: 'false' },
            ],
            required: false,
        },
        {
            name: 'tradable',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'Tradable ✅', value: 'true' },
                { name: 'Not for trade ❌', value: 'false' },
            ],
            required: false,
        },{
            name: 'usable',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'Usable ✅', value: 'true' },
                { name: 'Discardable ❌', value: 'false' },
            ],
            required: false,
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

            // Retrieve user inputs
            const newName = interaction.options.getString('new_name');
            const newEmoji = interaction.options.getString('new_emoji');
            const newPrice = interaction.options.getNumber('price');
            const isForSale = interaction.options.getString('is_for_sale') || 'true';
            const tradable = interaction.options.getString('tradable') || 'true';
            const usable = interaction.options.getString('usable') || 'false';

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
                isForSale: Boolean(isForSale),
                tradable: Boolean(tradable),
                usable: Boolean(usable),
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
                    // { name: 'Store', value: newStore.toString(), inline: true },
                    { name: 'Is For Sale', value: isForSale.toString(), inline: true },
                    { name: 'Tradable', value: tradable.toString(), inline: true},
                    { name: 'Usable', value: tradable.toString(), inline: true},
                );

            interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while creating the item.', ephemeral: true });
        }
    },
};
