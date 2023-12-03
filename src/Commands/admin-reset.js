const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-reset',
    description: 'Reset the inventory, balance, or both of a user',
    options: [
        {
            name: 'target_user',
            description: 'The user to reset',
            type: 6, // USER type
            required: true,
        },
        {
            name: 'reset_option',
            description: 'Select what to reset',
            type: 3, // STRING type
            required: true,
            choices: [
                { name: 'Inventories', value: 'inventories' },
                { name: 'Balance', value: 'balance' },
                { name: 'Both', value: 'both' },
            ],
        },
    ],
    async execute(interaction) {
        try {
            // Get the configuration from the database
            const config = await getDatabase().collection('configuration').findOne({ name: 'admin' });

            // Get the admin roles from the configuration
            const adminRoles = config.data.adminRoles;

            // Check if the user has any of the admin roles
            const hasRole = interaction.member.roles.cache.some(role => adminRoles.includes(role.id));
            if (!hasRole) {
                return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
            }
            
            // Get the target user and reset option from the interaction options
            const targetUser = interaction.options.getUser('target_user');
            const resetOption = interaction.options.getString('reset_option');

            // Define update query based on reset option
            let updateQuery = {};

            switch (resetOption) {
                case 'inventories':
                    updateQuery = {
                        $set: {
                            inventory: [],
                            secondaryInventory: [],
                        },
                    };
                    break;
                case 'balance':
                    updateQuery = {
                        $set: {
                            cash: 0,
                            bank: 0,
                            stash: 0,
                        },
                    };
                    break;
                case 'both':
                    updateQuery = {
                        $set: {
                            cash: 0,
                            bank: 0,
                            stash: 0,
                            inventory: [],
                            secondaryInventory: [],
                        },
                    };
                    break;
                default:
                    return interaction.reply({ content: 'Invalid reset option.', ephemeral: true });
            }

            // Reset specified data in the database
            const result = await getDatabase().collection('users').updateOne({ _id: targetUser.id }, updateQuery);

            // Check if the update was successful
            if (result.modifiedCount > 0) {
                interaction.reply({ content: `Successfully reset ${resetOption} for ${targetUser.tag}.`, ephemeral: true });
            } else {
                interaction.reply({ content: `Failed to reset ${resetOption}.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error resetting data.', ephemeral: true });
        }
    },
};
