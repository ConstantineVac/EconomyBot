// send.js

const { getDatabase } = require('../database');

module.exports = {
    name: 'send',
    description: 'Send coins to another user',
    options: [
        {
            name: 'recipient',
            description: 'User to send coins to',
            type: 6, // USER type
            required: true,
        },
        {
            name: 'amount',
            description: 'Amount of money to send',
            type: 10, // INTEGER type
            required: true,
        },
    ],
    async execute(interaction) {
        try {
            // Extract options from the interaction
            const recipient = interaction.options.getUser('recipient');
            const amount = interaction.options.getNumber('amount');
            //console.log(amount)
            // Check if the amount is valid
            if (!amount || amount <= 0) {
                return interaction.reply({ content: 'Please provide a valid amount of money to send.', ephemeral: true });
            }

            // Retrieve sender and recipient information from the database
            const sender = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
            const recipientUser = await getDatabase().collection('users').findOne({ _id: recipient.id });

            // Check if the sender and recipient exist
            if (!sender || !recipientUser) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Check if the sender has enough coins
            //console.log(sender.bank)
            if (sender.bank < amount) {
                return interaction.reply({ content: 'You do not have enough funds to send.', ephemeral: true });
            }

            // Update sender and recipient balances in the database
            await getDatabase().collection('users').updateOne(
                { _id: interaction.user.id },
                { $inc: { bank: -amount } }
            );

            await getDatabase().collection('users').updateOne(
                { _id: recipient.id },
                { $inc: { balance: amount } }
            );

            interaction.reply({content: `You sent ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to ${recipient.username}.`, ephemeral: true});
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },
};
