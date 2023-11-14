// Import the necessary module
const { getDatabase } = require('../database');

module.exports = {
    // The name of the command
    name: 'withdraw',
    // A description of the command
    description: 'Withdraw coins from your bank',
    // The function to execute when the command is called
    // The options of the command
    options: [{
        name: 'amount',
        type: 4, // The type of the option
        description: 'The amount of coins to withdraw',
        required: true, // Whether the option is required or optional
    }],
    async execute(interaction) {
        // Get the ID of the user who invoked the command
        const userId = interaction.user.id;

        try {
            // Try to find the user's document in the database
            let user = await getDatabase().collection('users').findOne({ _id: userId });

            // If the user doesn't exist, initialize a new entry
            if (!user) {
                const newUser = {
                    _id: userId,
                    username: interaction.user.username,
                    balance: 0,
                    cash: 0,
                    stash: 0,
                    inventory: Array.from({ length: 200 }),
                    secondaryInventory: Array.from({ length: 300 }),
                    // Add other fields as needed
                };

                await getDatabase().collection('users').insertOne(newUser);

                // Retrieve the newly inserted user
                user = newUser;
            }

            // Get the amount to deposit from the user's input, defaulting to 0 if not provided
            const amountToWithdraw = interaction.options.getInteger('amount') || 0;

            // Check if the user has enough coins in the bank to withdraw
            if (user.bank >= amountToWithdraw && amountToWithdraw > 0) {
                // Move coins from the bank to cash
                await getDatabase().collection('users').updateOne(
                    { _id: userId },
                    { $inc: { bank: -amountToWithdraw, cash: amountToWithdraw } }
                );

                // Send a reply confirming the withdrawal
                interaction.reply(`Successfully withdrew 🪙 ${amountToWithdraw} coins from your bank.`);
            } else {
                // Send a reply if the user has insufficient funds or entered an invalid amount
                interaction.reply('Invalid amount or insufficient funds in your bank for withdrawal.');
            }

        } catch (error) {
            // If there was an error, log it to the console and send a reply
            console.error(error);
            interaction.reply({ content: 'There was an error withdrawing coins.', ephemeral: true });
        }
    },
};
