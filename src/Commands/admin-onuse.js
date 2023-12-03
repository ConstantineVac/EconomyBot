const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-onuse',
    description: 'Configure on-use actions for an item',
    options: [
        {
            name: 'item_name',
            description: 'Enter the name of the item to configure on-use actions',
            type: 3, // String type
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'send_message',
            description: 'Enter the message to send when the item is used',
            type: 3, // String type
            required: false,
        },
        {
            name: 'add_balance',
            description: 'Enter the amount to add to the user\'s balance (use negative values for deduction)',
            type: 10, // 
            required: false,
        },
        {
            name: 'deduct_balance',
            description: 'Enter the amount to deduct from the user\'s balance',
            type: 10, // 
            required: false,
        },
        {
            name: 'grant_role',
            description: 'Enter the role to grant to the user',
            type: 3, // String type
            required: false,
        },
        {
            name: 'remove_role',
            description: 'Enter the role to remove from the user',
            type: 3, // String type
            required: false,
        },
        {
            name: 'give_item',
            description: 'Enter the item to give to the user',
            type: 3, // String type
            required: false,
        },
        {
            name: 'random_item',
            description: 'Enter a list of items to randomly give to the user',
            type: 3, // String type
            required: false,
            isList: true,
        },
    ],
    autocomplete: async function (interaction) {
        try {
            // Get the user's input
            const userInput = interaction.options.getString('item_name');

            // Fetch the items from the database that match the user's input
            const items = await getDatabase().collection('items').find({ name: { $regex: userInput, $options: 'i' } }).toArray();
            //console.log(items)
            // Map the items to the format needed for choices
            const choicesItems = items.map(item => ({ name: item.name, value: item.name }));

            // Respond with the choices
            await interaction.respond(choicesItems.slice(0, 25));
        } catch (error) {
            console.error(error);
            await interaction.respond({ content: 'An error occurred while fetching item choices.', ephemeral: true });
        }
    },
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

            // Retrieve user inputs
            const itemName = interaction.options.getString('item_name');
            const sendMessage = interaction.options.getString('send_message');
            const addBalance = interaction.options.getNumber('add_balance');
            const deductBalance = interaction.options.getNumber('deduct_balance');
            const grantRole = interaction.options.getString('grant_role');
            const removeRole = interaction.options.getString('remove_role');
            const giveItem = interaction.options.getString('give_item');
            const randomItems = interaction.options.getString('random_item');

            // Fetch item from the database
            const item = await getDatabase().collection('items').findOne({ name: itemName });

            if (!item) {
                return interaction.reply({ content: `Item: ${itemName} not found.`, ephemeral: true });
            }

            // Create or update on-use object with the selected actions
            item.onUse = {
                sendMessage: sendMessage || false,
                addBalance: addBalance || false,
                deductBalance: deductBalance || false,
                grantRole: grantRole || '',
                removeRole: removeRole || '',
                giveItem: giveItem || '',
                randomItem: randomItems || [],
            };

            // Update item in the database
            await getDatabase().collection('items').updateOne({ name: itemName }, { $set: item });


            // Create an embed to display the changes
            const embed = new EmbedBuilder()
                .setTitle('✨ On-Use Actions Configured')
                .setColor('Green')
                .setDescription(`Configured on-use actions for the item: ${itemName}`)
                .addFields(
                    { name: 'Send Message', value: sendMessage ? sendMessage : 'None', inline: true },
                    { name: 'Add Balance', value: addBalance !== null ? addBalance.toString() : 'None', inline: true },
                    { name: 'Deduct Balance', value: deductBalance !== null ? deductBalance.toString() : 'None', inline: true },
                    { name: 'Grant Role', value: grantRole !== null ? grantRole.toString() : 'None', inline: true },
                    { name: 'Remove Role', value: removeRole !== null ? removeRole.toString() : 'None', inline: true },
                    { name: 'Give Item', value: giveItem !== null ? giveItem.toString() : 'None', inline: true },
                    { name: 'Random Items', value: Array.isArray(randomItems) ? randomItems.join(', ') : 'None', inline: true },
                );

            interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while configuring on-use actions.', ephemeral: true });
        }
    },
};
