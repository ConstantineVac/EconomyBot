// Import the necessary module
const { getDatabase } = require('../database');

module.exports = {
    // The name of the command
    name: 'deposit',
    // A description of the command
    description: 'Deposit coins into your account',
    // The options of the command
    options: [{
        name: 'amount',
        type: 4, // The type of the option
        description: 'The amount of coins to deposit',
        required: true, // Whether the option is required or optional
    }],
    // The function to execute when the command is called
    async execute(interaction) {
        // Get the ID of the user who invoked the command
        const userId = interaction.user.id;

        // Get the amount to deposit from the command options
        const amount = interaction.options.getInteger('amount');
        // If the amount is less than or equal to 0, send a reply and stop execution
        if (amount <= 0) {
            console.log(amount)
            return interaction.reply('Please provide a valid positive number to deposit.');
        }

        try {
            // Try to update the user's balance in the database
            const result = await getDatabase().collection('users').updateOne(
                { _id: userId }, // Filter: select the user with the given ID
                { $inc: { balance: amount } }, // Update: increment the user's balance by the given amount
                { upsert: true } // Options: if the user doesn't exist, create a new document
            );

            // If the update operation didn't modify or insert any documents, send a reply and stop execution
            if (result.modifiedCount === 0 && result.upsertedCount === 0) {
                return interaction.reply('Failed to deposit coins. Please try again.');
            }

            // Retrieve the user's document from the database
            const user = await getDatabase().collection('users').findOne({ _id: userId });
            // Send a reply with the new balance
            interaction.reply(`Successfully deposited ${amount} coins. Your balance is now ${user.balance} coins.`);
        } catch (error) {
            // If there was an error, log it to the console and send a reply
            console.error(error);
            interaction.reply({ content: 'There was an error processing your deposit.', ephemeral: true });
        }
    },
};
