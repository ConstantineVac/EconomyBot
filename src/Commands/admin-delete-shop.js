const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-delete-shop',
    description: 'Delete an existing shop',
    options: [
        {
            name: 'shop_name',
            type: 3, // String type
            description: 'Name of the shop to delete',
            required: true,
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

            // Extract shop name from the user's input
            const shopNameToDelete = interaction.options.getString('shop_name');

            // Delete the shop from the 'shop' collection in the database
            const deletionResult = await getDatabase().collection('shop').deleteOne({ shop_name: shopNameToDelete });

            // Check if a shop was deleted
            if (deletionResult.deletedCount === 1) {
                interaction.reply({ content: `Shop "${shopNameToDelete}" deleted successfully!`, ephemeral: true });
            } else {
                interaction.reply({ content: `Shop "${shopNameToDelete}" not found.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while deleting the shop.', ephemeral: true });
        }
    },
};
