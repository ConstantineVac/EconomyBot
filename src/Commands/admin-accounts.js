const { CommandInteraction, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-accounts',
    description: 'Modify entries in the info collection',
    options: [
        {
            name: 'account_type',
            description: 'Select the account type to modify',
            type: 3,
            required: true,
            choices: [
                { name: 'Cash', value: 'cash' },
                { name: 'Bank', value: 'bank' },
                { name: 'Stash', value: 'stash' },
            ],
        },
        {
            name: 'emoji',
            description: 'Enter the new emoji for the selected entry',
            type: 3,
            required: false,
        },
        {
            name: 'name',
            description: 'Enter the new name for the selected entry',
            type: 3,
            required: false,
        },
        {
            name: 'default_amount',
            description: 'Enter the new default amount for the selected entry',
            type: 10,
            required: false,
        },
    ],
    async execute(interaction) {
        // Get the configuration from the database
        const config = await getDatabase().collection('configuration').findOne({ name: 'admin' });

        // Get the admin roles from the configuration
        const adminRoles = config.data.adminRoles;
        
        // Check if the user has any of the admin roles
        const hasRole = interaction.member.roles.cache.some(role => adminRoles.includes(role.id));
        
        if (!hasRole) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        // Fetch the selected account type from the options
        const accountType = interaction.options.getString('account_type');

        // Fetch all entries from the 'info' collection
        const entries = await getDatabase().collection('info').find().toArray();

        // Find the selected entry
        const selectedEntry = entries.find(entry => entry.name === accountType);

        if (!selectedEntry) {
            return interaction.reply('Invalid account type selected.');
        }

        // Fetch values from the options
        const newEmoji = interaction.options.getString('emoji');
        const newName = interaction.options.getString('name');
        const newDefaultAmount = interaction.options.getNumber('default_amount');

        // Update the selected entry with new values
        if (newEmoji) selectedEntry.data.emoji = newEmoji;
        if (newName) selectedEntry.data.name = newName;
        if (!isNaN(newDefaultAmount)) selectedEntry.data.defaultAmount = newDefaultAmount;

        // Update the entry in the 'info' collection
        await getDatabase().collection('info').updateOne({ _id: selectedEntry._id }, { $set: { data: selectedEntry.data } });

        // Send a confirmation message
        interaction.reply({ content: `✅ Entry **${selectedEntry.data.name}** updated successfully.`, ephemeral: true });
    },
};
