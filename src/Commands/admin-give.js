// Import the necessary module
const { getDatabase } = require('../database');

module.exports = {
    // The name of the command
    name: 'admin-give',
    // A description of the command
    description: 'Admin gives or takes money from users',
    // The options of the command
    options: [
        {
            name: 'action',
            description: 'Add or Remove Money',
            type: 3, //String
            required: true,
            choices: [
                { name: 'Add➕', value: 'Add' },
                { name: 'Remove➖', value: 'Remove' },
            ],
        },
        {
            name: 'recipient',
            description: 'Target User',
            type: 6, // USER type
            required: true,
        },
        {
            name: 'amount',
            type: 4, // The type of the option
            description: 'The amount of coins to add',
            required: true, // Whether the option is required or optional
        }
    ],
    // The function to execute when the command is called
    async execute(interaction) {
        // Check if the user has the required role (replace ROLE_ID with the actual role ID)
        if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST) && !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)) {
            return interaction.reply('You do not have the required role to use this command.');
        }

        // Get the ID of the target user
        const targetUserId = interaction.options.getUser('recipient').id;

        try {
            // Check if the target user exists in the database
            const userExists = await getDatabase().collection('users').findOne({ _id: targetUserId });

            // If the user doesn't exist, initialize a new entry
            if (!userExists) {
                const newUser = {
                    _id: targetUserId,
                    username: interaction.options.getUser('recipient').username,
                    cash: 0,
                    bank: 0, 
                    stash: 0,
                    inventory: [ ],
                    secondaryInventory: [ ],
                    // Add other fields as needed
                };

                await getDatabase().collection('users').insertOne(newUser);
            }

            // Get the action and amount from the command options
            const action = interaction.options.getString('action');
            const amount = interaction.options.getInteger('amount');

            // Validate the amount
            if (amount <= 0) {
                return interaction.reply('Please provide a valid positive number for the amount.');
            }

            // Determine whether to add or remove based on the selected action
            const updateOperation = (action === 'Add') ? { $inc: { bank: amount } } : { $inc: { bank: -amount } };

            // Try to update the target user's balance in the database
            const result = await getDatabase().collection('users').updateOne(
                { _id: targetUserId },
                updateOperation,
                { upsert: true }
            );

            // If the update operation didn't modify or insert any documents, send a reply and stop execution
            if (result.modifiedCount === 0 && result.upsertedCount === 0) {
                return interaction.reply('Failed to update coins. Please try again.');
            }

            // Retrieve the target user's document from the database
            const targetUser = await getDatabase().collection('users').findOne({ _id: targetUserId });
            // Send a reply with the new balance of the target user
            interaction.reply(`<@${interaction.user.id}> ${action === 'Add' ? 'deposited' : 'withdrew'} ${amount} coins to/from <@${targetUser._id}>'s account. Their balance is now ${targetUser.bank} coins.`);
        } catch (error) {
            // If there was an error, log it to the console and send a reply
            console.error(error);
            interaction.reply({ content: 'There was an error processing the update.', ephemeral: true });
        }
    },
};
