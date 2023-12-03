// admin-edit-item.js

const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-edit-item',
    description: 'Edit the properties of an item',
    options: [
        {
            name: 'item_name',
            description: 'Enter the name of the item to edit',
            type: 3, // String type
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'new_name',
            description: 'Enter the new name for the item',
            type: 3, // String type
            required: false,
        },
        {
            name: 'new_emoji',
            description: 'Enter the new emoji for the item',
            type: 3, // String type
            required: false,
        },
        {
            name: 'price',
            description: 'Enter the new price for the item',
            type: 10, // Integer type
            required: false,
        },
        {
            name: 'is_for_sale',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // String type,
            choices: [
                { name: 'For Sale ✅', value: 'true' },
                { name: 'Not for sale ❌', value: 'false' },
            ],
            required: false,
        },
        {
            name: 'tradable',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'Tradable ✅', value: 'true' },
                { name: 'Not for trade ❌', value: 'false' },
            ],
            required: false,
        },
        {
            name: 'usable',
            description: 'Specify if the item is for sale (true/false)',
            type: 3, // Boolean type
            choices: [
                { name: 'Usable ✅', value: 'true' },
                { name: 'Non-usable ❌', value: 'false' },
            ],
            required: false,
        },
        {
            name: 'illegal',
            description: 'Specify if the item is illegal (true/false)',
            type: 3,
            choices: [
                { name: 'Illegal', value: 'true' },
                { name: 'Legal', value: 'false'} 
            ],
            required: false,
        }
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
            const newName = interaction.options.getString('new_name');
            const newEmoji = interaction.options.getString('new_emoji');
            const newPrice = interaction.options.getNumber('price');
            const isForSale = interaction.options.getString('is_for_sale');
            const isTradable = interaction.options.getString('tradable');
            const isUsable = interaction.options.getString('usable');
            const isIllegal = interaction.options.getString('illegal');

            //console.log([ newName, newEmoji, newPrice, isForSale, isTradable, isUsable, isIllegal ])

            // Fetch item from the database
            const item = await getDatabase().collection('items').findOne({ name: itemName });

            if (!item) {
                return interaction.reply({ content: 'Item not found.', ephemeral: true });
            }

            // Edit item's properties based on provided inputs
            if (newName !== null) {
                item.name = newName;
            }

            if (newEmoji !== null) {
                item.emoji = newEmoji;
            }

            if (newPrice !== null) {
                item.price = newPrice;
            }

            // Convert string values to boolean
            if (isForSale !== null) {
                item.isForSale = isForSale.toLowerCase() === 'true';
            }

            if (isTradable !== null) {
                item.isTradable = isTradable.toLowerCase() === 'true';
            }

            if (isUsable !== null) {
                item.isUsable = isUsable.toLowerCase() === 'true';
            }

            if (isIllegal !== null) {
                item.isIllegal = isIllegal.toLowerCase() === 'true';
            }

            // Update item in the database
            await getDatabase().collection('items').updateOne({ name: itemName }, { $set: item });

            //console.log(item)

            // Update item in the database
            //await getDatabase().collection('items').updateOne({ name: itemName }, { $set: item });

            const embedFields = [
                { name: 'New Name', value: newName !== null ? newName.toString() : itemName.toString(), inline: true },
                { name: 'New Emoji', value: newEmoji !== null ? newEmoji.toString() : item.emoji.toString(), inline: true },
                { name: 'New Price', value: newPrice !== null ? newPrice
                                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : item.price
                                                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' }), inline: true },
                { name: 'Is For Sale', value: isForSale !== null ? isForSale.toString() : (item.isForSale ? 'true' : 'false'), inline: true },
                { name: 'Tradable', value: isTradable !== null ? isTradable.toString() : (item.isTradable ? 'true' : 'false'), inline: true },
                { name: 'Usable', value: isUsable !== null ? isUsable.toString() : (item.isUsable ? 'true' : 'false'), inline: true },
                { name: 'Illegal', value: isIllegal !== null ? isIllegal.toString() : (item.isIllegal ? 'true' : 'false'), inline: true },

            ];
            
            // Remove fields where the value is 'undefined'
            const filteredEmbedFields = embedFields.filter(field => field.value !== 'undefined');
            
            // Create an embed to display the changes
            const embed = new EmbedBuilder()
                .setTitle('✏️ Item Edited')
                .setColor('Green')
                .setDescription(`Edited the item: ${itemName}`)
                .addFields(...filteredEmbedFields);
            
            interaction.reply({ embeds: [embed], ephemeral: true });            
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while editing the item.', ephemeral: true });
        }
    },
};
