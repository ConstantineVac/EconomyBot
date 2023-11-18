// admin-edit-account.js

const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-edit-account',
    description: 'Edit the cash or bank money of a user',
    options: [
        {
            name: 'target_user',
            description: 'Select the user to edit',
            type: 6, // User type
            required: true,
        },
        {
            name: 'cash',
            description: 'Specify the amount to edit in cash',
            type: 10, // String type
            required: false,
        },
        {
            name: 'bank',
            description: 'Specify the amount to edit in the bank',
            type: 10, // String type
            required: false,
        },
    ],
    async execute(interaction) {
        try {
            // Check if the user has the required role (replace ROLE_ID with the actual role ID)
            if (
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST) &&
                !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)
            ) {
                return interaction.reply('You do not have the required role to use this command.');
            }

            // Retrieve user inputs
            const targetUser = interaction.options.getUser('target_user');
            const cashAmount = interaction.options.getNumber('cash');
            const bankAmount = interaction.options.getNumber('bank');

            // Fetch user from the database
            const user = await getDatabase().collection('users').findOne({ _id: targetUser.id });

            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Edit user's cash or bank money based on provided inputs
            if (cashAmount !== null) {
                user.cash = cashAmount;
            }

            if (bankAmount !== null) {
                user.bank = bankAmount;
            }

            // Update user in the database
            await getDatabase().collection('users').updateOne({ _id: targetUser.id }, { $set: user });

            // Format the money for better readabillity.
            const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

            interaction.reply(`User: <@${targetUser.id}> updated successfully! New balance: 💵${formattedCash} - 💳${formattedBank}`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while editing the account.', ephemeral: true });
        }
    },
};
