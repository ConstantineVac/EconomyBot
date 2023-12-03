// admin-delete-item.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-delete-item',
    description: 'Delete an item from the collection',
    options: [
        {
            name: 'name',
            description: 'Name of the item to delete',
            type: 3,
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

            // Retrieve data from options
            const itemName = interaction.options.getString('name');

            // Validate data (add more validation if needed)
            if (!itemName) {
                return interaction.reply('Please provide a valid name of the item to delete.');
            }

            // Check if the item exists
            const existingItem = await getDatabase().collection('items').findOne({ name: itemName });
            const itemEmoji = existingItem.emoji;

            if (!existingItem) {
                return interaction.reply('Item not found in the database.');
            }

            // Delete the item from the 'items' collection
            await getDatabase().collection('items').deleteOne({ name: itemName });

            // Respond with the embed and buttons
            interaction.reply(`Item ${existingItem.emoji} ${existingItem.name} was successfully deleted from the database`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error deleting the item.', ephemeral: true });
        }
    },
};
