// admin-edit-recipe.js

const { EmbedBuilder, SelectMenuBuilder, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('@discordjs/builders');
const { getDatabase } = require('../database');
const { ObjectId } = require('mongodb');
const { ButtonBuilder } = require('discord.js');

async function updateRecipeInDatabase(recipeId, updatedFields) {
    await getDatabase().collection('recipes').updateOne({ _id: new ObjectId(recipeId) }, { $set: updatedFields });
}

module.exports = {
    name: 'admin-edit-recipe',
    description: 'Edit an existing recipe.',
    options: [
        {
            name: 'recipe',
            description: 'Choose a recipe.',
            type: 3, // String
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'role',
            description: 'Edit role',
            type: 8, // role type
            required: false,
        },
        {
            name: 'cost',
            description: 'Edit the amount of money it costs.',
            type: 10, // number type
            required: false,
        },
        {
            name: 'amount',
            description: 'Edit the amount of crafting items you get.',
            type: 4, // Integer
            required: false,
        },
        {
            name: 'add_ingredient',
            description: 'Add an ingredient.',
            type: 3, // string type
            required: false,
            choices: [],
            autocomplete: true,
        }, 
        {
            name: 'remove_ingredient',
            description: 'Remove an ingredient.',
            type: 3, // string type
            required: false,
            choices: [],
            autocomplete: true,
        }
    ],
    autocomplete: async function (interaction) {
    try {
        if (!interaction.isAutocomplete()) return;
    
            let choices; // Initialize choices here
            const focusedOption = interaction.options.getFocused(true);
    
            if (focusedOption.name === 'recipe') {
                // Your logic for handling shop_name autocomplete
                const userInput = focusedOption.value;

                // Fetch recipes from the database that match the user's input
                const recipes = await getDatabase().collection('recipes').find({ itemId: { $exists: true } }).toArray();
                
                // Log the fetched recipes for debugging
                console.log('Fetched Recipes:', recipes);

                // Map the recipes to the format needed for choices
                const choicesRecipes = await Promise.all(recipes.map(async (recipe) => {
                    // Find the item.name from 'items' based on the recipe.itemId
                    const item = await getDatabase().collection('items').findOne({ id: recipe.itemId });

                    // Log the found item for debugging
                    console.log('Found Item:', item);

                    // Format the recipe for choices
                    return {
                        name: `${item.name} - Amount: ${recipe.amount} - Cost: ${recipe.cost}`,
                        value: recipe._id.toString(), // Use the ObjectId as the value
                    };
                }));

                // Assign choicesRecipes to choices
                choices = choicesRecipes;
                console.log(choices)
            }
        
            if (focusedOption.name === 'add_ingredient') {
                // Your logic for handling item_name autocomplete
                const userInput = focusedOption.value;
                const items = await getDatabase().collection('items').find({ name: { $regex: userInput, $options: 'i' } }).toArray();
                choices = items.map(item => ({ name: item.name, value: item.name }));
            }

            if (focusedOption.name === 'remove_ingredient') {
                const userInput = focusedOption.value;

                // Fetch recipes from the database that match the user's input
                const recipes = await getDatabase().collection('recipes').find({ itemId: { $exists: true } }).toArray();
                
                // Log the fetched recipes for debugging
                console.log('Fetched Recipes:', recipes);
                
                const items = await getDatabase().collection('items').find({ name: { $regex: userInput, $options: 'i' } }).toArray();
                choices = items.map(item => ({ name: item.name, value: item.name }));
            }

            const filtered = choices.filter(choice => choice.name.startsWith(focusedOption.value));
            await interaction.respond( filtered.slice(0, 25));
        } catch (error) {
            console.error(error);
            await interaction.respond({ content: 'An error occurred while fetching recipe choices.', ephemeral: true })
        }
    },
    async execute(interaction) {
        try {
            // Retrieve options from the interaction
            const recipeId = interaction.options.getString('recipe');
            const role = interaction.options.getRole('role');
            const cost = interaction.options.getNumber('cost');
            const amount = interaction.options.getInteger('amount');
            const addIngredient = interaction.options.getString('add_ingredient');
            const removeIngredient = interaction.options.getString('remove_ingredient');
    
            // Fetch the recipe from the database based on recipeId
            const recipe = await getDatabase().collection('recipes').findOne({ _id: new ObjectId(recipeId) });
    
            // Check if the recipe exists
            if (!recipe) {
                await interaction.respond({ content: 'Recipe not found.', ephemeral: true });
                return;
            }
    
            // Update the recipe based on the provided options
            if (role) {
                // Update role logic
                recipe.role = role.id; // Assuming role.id should be stored in the recipe document
            }

            if (cost){
                // cost
                recipe.cost = cost;
            }
    
            if (amount !== null && amount !== undefined) {
                // Update amount logic
                recipe.amount = amount;
            }
    
            if (addIngredient) {
                // Add ingredient logic
                const item = await getDatabase().collection('items').findOne({ name: addIngredient });
                
                if (item) {
                    // Update cost based on the cost of the item
                    recipe.cost = item.cost || 0;
                    
                    // Assuming 'ingredients' is an array in your recipe document
                    recipe.ingredients.push({
                        itemId: item.id,
                        itemName: item.name,
                    });
                } else {
                    await interaction.respond({ content: 'Item not found.', ephemeral: true });
                    return;
                }
            }    
    
            if (removeIngredient) {
                // Remove ingredient logic
                // Assuming 'ingredients' is an array in your recipe document
                recipe.ingredients = recipe.ingredients.filter(ingredient => ingredient !== removeIngredient);
            }
    
            // Update the recipe in the database
            await updateRecipeInDatabase(recipeId, recipe);
    
            // Respond to the interaction
            await interaction.reply({ content: 'Recipe updated successfully.', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while updating the recipe.', ephemeral: true });
        }
    }
}

