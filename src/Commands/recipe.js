// recipe.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const MATERIALS_PER_PAGE = 5;

module.exports = {
    name: 'recipe',
    description: 'View available recipes',
    async execute(interaction) {
        try {
            // Retrieve recipes from the database
            const recipes = await getDatabase().collection('recipes').find().toArray();

            // Check if there are any recipes
            if (!recipes || recipes.length === 0) {
                return interaction.reply('No recipes available.');
            }

            // Calculate the total number of pages
            const totalPages = Math.ceil(recipes.length / MATERIALS_PER_PAGE);

            // Retrieve the page number from the interaction (default to 1 if not provided)
            const pageNumber = parseInt(interaction.options.getString('page')) || 1;

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * MATERIALS_PER_PAGE;
            const endIndex = Math.min(startIndex + MATERIALS_PER_PAGE, recipes.length);

            // Create an embed to display the available recipes for the current page
            const embed = new EmbedBuilder()
                .setTitle('Recipes')
                .setDescription(`Available recipes (Page ${pageNumber}/${totalPages})`);

            // Add each recipe and its ingredients to the embed
            for (let i = startIndex; i < endIndex; i++) {
                const recipe = recipes[i];

                // Extract information from the recipe
                const recipeName = recipe.name;
                const ingredients = recipe.ingredients.map(({ materialId, materialName, amount }) =>
                    `${materialName} x ${amount}`
                ).join(', ');

                // Add information to the embed
                embed.addFields({
                    name: `${recipeName} - ${ingredients}`,
                    value: `Result: ${recipe.output.amount} ${recipe.output.item}`,
                });
            }

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
                .setCustomId('previousPage')
                .setLabel('Previous Page')
                .setStyle(1);

            const nextButton = new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('Next Page')
                .setStyle(1);

            // Create an action row for the buttons
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            interaction.reply({ embeds: [embed], components: [actionRow] });
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching available recipes.', ephemeral: true });
        }
    },
};
