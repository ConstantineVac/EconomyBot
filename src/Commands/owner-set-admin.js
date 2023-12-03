const { getDatabase } = require('../database');

module.exports = {
    name: 'owner-set-admin',
    description: 'Add or remove a role from the admin roles',
    options: [
        {
            name: 'target_role',
            description: 'The role to modify',
            type: 8, // ROLE type
            required: true,
        },
        {
            name: 'action',
            description: 'Specify the action',
            type: 3, // STRING type
            required: true,
            choices: [
                { name: 'Add', value: 'add' },
                { name: 'Remove', value: 'remove' },
            ],
        },
    ],
    async execute(interaction) {
        try {
            // Get the configuration from the database
            const info = await getDatabase().collection('configuration').findOne({ name: 'admin' });

            // Get the admin roles from the configuration
            const owners = info.data.owners;

            //console.log(owners)

            // Check if the user has any of the admin roles
            const isOwner = owners.includes(interaction.user.id);
            const isServerOwner = interaction.guild && interaction.guild.ownerId === interaction.user.id;
            //console.log(isServerOwner)
            if (!isOwner && !isServerOwner) {
                return interaction.reply({ content: 'You do not have owner permission to use this command.', ephemeral: true });
            }

            // Get the target role and action from the interaction options
            const targetRole = interaction.options.getRole('target_role');
            const action = interaction.options.getString('action');

            // Get the configuration data from the database
            const config = await getDatabase().collection('configuration').findOne({ name: 'admin' });
            
            //console.log(config)

            if (!config) {
                return interaction.reply({ content: 'Configuration data not found.', ephemeral: true });
            }

            // Get the current admin roles
            let admins = config?.data?.adminRoles || [];

            // Perform the specified action
            if (action === 'add') {
                // Add the role to admin roles
                if (!admins.includes(targetRole.id)) {
                    admins.push(targetRole.id);
                } else {
                    return interaction.reply({ content: `Role: ${targetRole} already exists. Try another role.`, ephemeral: true });
                }
            } else if (action === 'remove') {
                // Remove the role from admin roles
                admins = admins.filter(roleId => roleId !== targetRole.id);
            } else {
                return interaction.reply({ content: 'Invalid action.', ephemeral: true });
            }

            // Update the admin roles in the configuration data
            const result = await getDatabase().collection('configuration').updateOne(
                { name: 'admin' }, // Specify the document to update
                { $set: { 'data.adminRoles': admins } } // Update the adminRoles field
            );


            // Check if the update was successful
            if (result.modifiedCount > 0) {
                interaction.reply({ content: `Successfully ${action === 'add' ? 'added to' : 'removed from'} admin roles: ${targetRole}.`, ephemeral: true });
            } else {
                interaction.reply({ content: `Failed to ${action === 'add' ? 'add to' : 'remove from'} admin roles.`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error updating admin roles.', ephemeral: true });
        }
    },
};

async function isUserOwner(userId) {
    // Check if the user is an owner based on the 'owners' array in the 'configuration' collection
    const config = await getDatabase().collection('configuration').findOne();
    return config?.data?.owners?.includes(userId) || false;
}
