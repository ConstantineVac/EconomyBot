const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Load user
            const user = await getDatabase().collection('users').findOne({ _id: userId });

            // Load data for each category from the info collection
            const categories = ['cash', 'bank', 'stash', 'balance', 'currentJob'];
            const categoryData = {};

            for (const category of categories) {
                const categoryInfo = await getDatabase().collection('info').findOne({ name: category });
                categoryData[category] = categoryInfo?.data || {};
            }

        
            // If the user doesn't exist, initialize a new entry
            if (!user) {
                const newUser = {
                    _id: userId,
                    username: interaction.user.username,
                    cash: categoryData.cash.defaultAmount,
                    bank: categoryData.bank.defaultAmount,
                    stash: categoryData.stash.defaultAmount,
                    inventory: [],  // Initialize as an empty array
                    secondaryInventory: [],  // Initialize as an empty array
                    currentJob: null
                    // Add other fields as needed
                };

                await getDatabase().collection('users').insertOne(newUser);

                // Retrieve the newly inserted user
                user = newUser;
            }
            
            // Format the money for better readability
            const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

            // Create an embed to display the user's balance
            const embed = new EmbedBuilder()
                .setTitle('Your Account:')
                .setDescription(`Name: ${user.username}`)
                .setThumbnail(`${categoryData.balance.url}`)
                .setColor('Green')
                .addFields(
                    { name: `${categoryData.cash?.emoji} ${categoryData.cash?.name}`, value: formattedCash || '0', inline: true },
                    { name: `${categoryData.bank?.emoji} ${categoryData.bank?.name}`, value: formattedBank || '0', inline: true },
                    { name: `${categoryData.stash?.emoji} ${categoryData.stash?.name}`, value: user.stash.toString() || '0', inline: true },
                    { name: `${categoryData.currentJob?.emoji} ${categoryData.currentJob?.name}`, value: user.currentJob ? user.currentJob.name : 'Unemployed', inline: true },
                );

            // Send the embed as a reply
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error checking your balance.', ephemeral: true });
        }
    },
};
