const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            var user = await getDatabase().collection('users').findOne({ _id: userId });

            // If the user doesn't exist, initialize a new entry
            if (!user) {
                const newUser = {
                    _id: userId,
                    username: interaction.user.username,
                    cash: 0,
                    bank: 0, 
                    stash: 0,
                    inventory: Array(200).fill(null),
                    secondaryInventory: Array(300).fill(null),
                    // Add other fields as needed
                };

                await getDatabase().collection('users').insertOne(newUser);

                // Retrieve the newly inserted user
                user = newUser;
            }

            // Create an embed to display the user's balance
            const embed = new EmbedBuilder()
                .setTitle('Your Account:')
                .setColor('Green')
                .addFields(
                    { name: '💵 Cash', value: user.cash.toString() || '0', inline: true},
                    { name: '💳 Bank', value: user.bank.toString() || '0', inline: true},
                    { name: '💰 Stash', value: user.stash.toString() || '0', inline: true}
                );

            // Send the embed as a reply
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error checking your balance.', ephemeral: true });
        }
    },
};
