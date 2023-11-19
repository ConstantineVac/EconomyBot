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
        if (!interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) && 
            !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI) && 
            !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2)) {
                return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        // Get the ID of the target user
        const targetUserId = interaction.options.getUser('recipient').id;

        try {
            // Check if the target user exists in the database
            const userExists = await getDatabase().collection('users').findOne({ _id: targetUserId });

            // Load data for each category from the info collection
            const categories = ['cash', 'bank', 'stash', 'balance', 'currentJob'];
            const categoryData = {};

            for (const category of categories) {
                const categoryInfo = await getDatabase().collection('info').findOne({ name: category });
                categoryData[category] = categoryInfo?.data || {};
            }


            // If the user doesn't exist, initialize a new entry
            if (!userExists) {
                const newUser = {
                    _id: targetUserId,
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
                return interaction.reply('Failed to update balance. Please try again.');
            }

            // Retrieve the target user's document from the database
            const targetUser = await getDatabase().collection('users').findOne({ _id: targetUserId });

            // Format the money for better readabillity.
            const formattedAmount = amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            const formattedBank = targetUser.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

            // Send a reply with the new balance of the target user
            interaction.reply(`<@${interaction.user.id}> ${action === 'Add' ? 'deposited' : 'withdrew'} ${formattedAmount} to/from <@${targetUser._id}>'s account. Their balance is now ${formattedBank}.`);
        } catch (error) {
            // If there was an error, log it to the console and send a reply
            console.error(error);
            interaction.reply({ content: 'There was an error processing the update.', ephemeral: true });
        }
    },
};
