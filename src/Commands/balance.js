// Import the necessary module
const { getDatabase } = require('../database');

module.exports = {
    // The name of the command
    name: 'balance',
    // A description of the command
    description: 'Check your balance',
    // The function to execute when the command is called
    async execute(interaction) {
        // Get the ID of the user who invoked the command
        const userId = interaction.user.id;

        try {
            // Try to find the user's document in the database
            const user = await getDatabase().collection('users').findOne({ _id: userId });

            // If the user doesn't exist in the database, send a reply and stop execution
            if (!user) {
                return interaction.reply('You do not have a balance yet. Use the `/deposit` command to get started.');
            }

            // Send a reply with the user's balance
            interaction.reply(`Your balance is ${user.balance} coins.`);
        } catch (error) {
            // If there was an error, log it to the console and send a reply
            console.error(error);
            interaction.reply({ content: 'There was an error checking your balance.', ephemeral: true });
        }
    },
};

