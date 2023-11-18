// admin-add-item.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-create-item',
    description: 'Add a new item to the items collection',
    options: [
        {
            name: 'name',
            description: 'Name of the new item',
            type: 3, // String
            required: true,
        },
        {
            name: 'emoji',
            description: 'Emoji for the new item',
            type: 3, // String
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Check if the user has the required role
            if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST) && !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)) {
                return interaction.reply('You do not have the required role to use this command.');
            }

            // Retrieve data from options
            const itemName = interaction.options.getString('name');
            const itemEmoji = interaction.options.getString('emoji');

            // Validate data (add more validation if needed)
            if (!itemName || !itemEmoji) {
                return interaction.reply('Please provide a name and an emoji for the new item.');
            }

            // Add the new item to the database
            const newItem = {
                id: await getNextItemId(), // Function to get the next ID
                name: itemName,
                emoji: itemEmoji,
            };

            // Insert the new item into the 'items' collection
            await getDatabase().collection('items').insertOne(newItem);

            // Respond with the embed and buttons
            interaction.reply(`Successfully Added ${newItem.emoji} ${newItem.name} to the item list !`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error adding the new item.', ephemeral: true });
        }
    },
};

// Function to get the next item ID (assuming 'items' collection has an 'id' field)
async function getNextItemId() {
    const lastItem = await getDatabase().collection('items').findOne({}, { sort: { id: -1 } });
    return lastItem ? lastItem.id + 1 : 1;
}
