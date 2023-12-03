// admin-create-recipe.js

const { getDatabase } = require('../database');

module.exports = {
    name: 'admin-create-recipe',
    description: 'Create a new recipe.',
    options: [
        {
            name: 'item_name', 
            description: 'Choose an item to create a recipe for.',
            type: 3, // String
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'amount',
            description: 'The amount of items this recipe creates, default is 1.',
            type: 4,  // Integer
            required: false, 
        },
        {
            name: 'cost',
            description: 'The cost of money for a single creation, default is 0 (no cost).',
            type: 10,  // Number
            required: false, 
        },
        {
            name: 'role',
            description: 'Only the user with this role can craft this recipe, default is everyone.',
            type: 7,  // role
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
    
            // Get the options from the interaction
            const itemName = interaction.options.getString('item_name');
            const amount = interaction.options.getInteger('amount') || 1;
            const cost = interaction.options.getNumber('cost') || 0;
            const role = interaction.options.getRole('role') || null;
    
            // Fetch the item from the 'items' collection
            const itemFromDatabase = await getDatabase().collection('items').findOne({ name: itemName });
    
            // Check if the item exists
            if (!itemFromDatabase) {
                return interaction.reply({ content: `Item "${itemName}" not found. Please create the item first.`, ephemeral: true });
            }

            // Check if a recipe already exists for the specified item
            const existingRecipe = await getDatabase().collection('recipes').findOne({ itemId: itemFromDatabase.id });

            if (existingRecipe) {
                return interaction.reply({ content: `A recipe already exists for ${itemName}. Use\`/admin-edit-recipe\` to edit it.`, ephemeral: true });
            }
    
            // Create a new recipe object
            const newRecipe = {
                itemId: itemFromDatabase.id,
                amount,
                cost,
                role: role ? role.id : null,
            };
    
            // Add the new recipe to the 'recipes' collection in the database
            await getDatabase().collection('recipes').insertOne(newRecipe);
    
            // Respond with a success message
            interaction.reply({content: `Successfully created a new recipe for ${amount} ${itemName} with a cost of ${cost}.`, ephemeral: true});
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'An error occurred while processing the admin-create-recipe command.', ephemeral: true });
        }
    },
};