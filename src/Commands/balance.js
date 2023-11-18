const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database');

module.exports = {
    name: 'balance',
    description: 'Check your balance',
    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Load 
            // Load user
            var user = await getDatabase().collection('users').findOne({ _id: userId });

            // If the user doesn't exist, initialize a new entry
            if (!user) {
                const newUser = {
                    _id: userId,
                    username: interaction.user.username,
                    cash: 0.0,
                    bank: 0.0,
                    stash: 0.0,
                    inventory: [],  // Initialize as an empty array
                    secondaryInventory: [],  // Initialize as an empty array
                    // Add other fields as needed
                };



                await getDatabase().collection('users').insertOne(newUser);

                // Retrieve the newly inserted user
                user = newUser;
            }

            //console.log(user.currentJob.name)
            
            // Format the money for better readabillity.
            const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

            // Create an embed to display the user's balance
            const embed = new EmbedBuilder()
                .setTitle('Your Account:')
                //.setImage(`${interaction.user.displayAvatarURL()}`)
                .setDescription(`Name: ${user.username}`)
                .setThumbnail('https://i.postimg.cc/tJsjB71p/account.png')
                .setColor('Green')
                .addFields(
                    { name: '💵 Cash', value: formattedCash || '0', inline: true},
                    { name: '💳 Bank', value: formattedBank || '0', inline: true},
                    { name: '💰 Stash', value: user.stash.toString() || '0', inline: true},
                    { name: '💼 Occupation', value: user.currentJob ? user.currentJob.name : 'Unemployed', inline: true}, // Check if user.currentjob exists
                );

            // Send the embed as a reply
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error checking your balance.', ephemeral: true });
        }
    },
};
