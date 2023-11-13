// craft.js

const { getDatabase } = require('../database');

module.exports = {
    name: 'craft',
    description: 'Craft an item',
    options: [
        {
            name: 'recipe',
            description: 'choose a recipe',
            type: 3, // String
            required: true,
            choices: [] // This will be populated dynamically
        }
    ],
    async execute(interaction) {
        try {
            // Fetch the recipes from the database
        const recipes = await getDatabase().collection('recipes').find().toArray();

        // Map the recipes to the format needed for choices
        this.options[0].choices = recipes.map(recipe => ({ name: recipe.name, value: recipe.name }));

        // Get the recipe name from the interaction
        const recipeName = interaction.options.getString('recipe');

        // Retrieve the recipe from the database
        const recipe = await getDatabase().collection('recipes').findOne({ name: recipeName });

        // Check if the recipe exists
        if (!recipe) {
            return interaction.reply({ content: 'Recipe not found.', ephemeral: true });
        }

            // Retrieve the user from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user has all the required materials for the recipe
            for (const { materialId, amount } of recipe.ingredients) {
                const userMaterialIndices = [];
                for (let i = 0; i < user.inventory.length; i++) {
                    if (user.inventory[i].id === materialId) {
                        userMaterialIndices.push(i);
                    }
                }
                if (userMaterialIndices.length < amount) {
                    return interaction.reply({ content: 'You do not have the required materials for the recipe. Go to /shop in order to buy more!', ephemeral: true });
                }
            }

            // The user has all the required materials, so remove them from the user's inventory
            for (const { materialId, amount } of recipe.ingredients) {
                for (let i = 0; i < amount; i++) {
                    const userMaterialIndex = user.inventory.findIndex(item => item.id === materialId);
                    user.inventory.splice(userMaterialIndex, 1);
                }
            }

            // Add the crafted item to the user's inventory multiple times based on the output amount
            for (let i = 0; i < recipe.output.amount; i++) {
                user.inventory.push({ id: recipe.id, name: recipe.name });
            }

            // Update the user in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: user.inventory } });

            interaction.reply(`You have successfully crafted ${recipe.output.amount} x ${recipe.name}!`);
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
        }
    },
};
