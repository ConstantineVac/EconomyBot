// admin-edit-item.js

const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-edit-item',
    description: 'Edit the properties of an item',
    options: [
        {
            name: 'item_name',
            description: 'Enter the name of the item to edit',
            type: 3, // String type
            required: true,
        },
        {
            name: 'new_name',
            description: 'Enter the new name for the item',
            type: 3, // String type
            required: false,
        },
        {
            name: 'new_emoji',
            description: 'Enter the new emoji for the item',
            type: 3, // String type
            required: false,
        },
        {
            name: 'price',
            description: 'Enter the new price for the item',
            type: 10, // Integer type
            required: false,
        },
        {
            name: 'store',
            description: 'Enter the new store for the item',
            type: 3, // String type
            required: false,
        },
        {
            name: 'is_for_sale',
            description: 'Specify if the item is for sale (true/false)',
            type: 5, // Boolean type,
            choices: [
                { name: 'Usable ✅', value: 'true' },
                { name: 'Discardable ❌', value: 'false' },
            ],
            required: false,
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
            const itemName = interaction.options.getString('item_name');
            const newName = interaction.options.getString('new_name');
            const newEmoji = interaction.options.getString('new_emoji');
            const newPrice = interaction.options.getNumber('price');
            const newStore = interaction.options.getString('store');
            const isForSale = interaction.options.getString('is_for_sale');

            // Fetch item from the database
            const item = await getDatabase().collection('items').findOne({ name: itemName });

            if (!item) {
                return interaction.reply({ content: 'Item not found.', ephemeral: true });
            }

            // Edit item's properties based on provided inputs
            if (newName !== null) {
                item.name = newName;
            }

            if (newEmoji !== null) {
                item.emoji = newEmoji;
            }

            if (newPrice !== null) {
                item.price = newPrice;
            }

            if (newStore !== null) {
                item.store = newStore;
            }

            if (isForSale !== null) {
                item.isForSale = Boolean(isForSale);
            }

            // Update item in the database
            await getDatabase().collection('items').updateOne({ name: itemName }, { $set: item });

            // Create an embed to display the changes
            const embed = new EmbedBuilder()
                .setTitle('✏️ Item Edited')
                .setColor('Green')
                .setDescription(`Edited the item: ${itemName}`)
                .addFields(
                    { name: 'New Name', value: newName !== null ? newName.toString() : itemName.toString(), inline: true },
                    { name: 'New Emoji', value: newEmoji !== null ? newEmoji.toString() : item.emoji.toString(), inline: true },
                    { name: 'New Price', value: newPrice !== null ? newPrice
                                                                            .toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : item.price
                                                                            .toLocaleString('en-US', { style: 'currency', currency: 'USD' }), inline: true },
                    { name: 'New Store', value: newStore !== null ? newStore.toString() : item.store.toString(), inline: true },
                    { name: 'Is For Sale', value: isForSale !== null ? isForSale.toString() : item.isForSale.toString(), inline: true }
                );

            interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while editing the item.', ephemeral: true });
        }
    },
};
