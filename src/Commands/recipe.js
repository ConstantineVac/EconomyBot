// recipe.js

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const MATERIALS_PER_PAGE = 5;

module.exports = {
    name: 'recipe',
    description: 'View available recipes',
    async execute(interaction, pageNumber = 1) {
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
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }
    
            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * MATERIALS_PER_PAGE;
            const endIndex = Math.min(startIndex + MATERIALS_PER_PAGE, recipes.length);
    
            // Create an embed to display the available recipes for the current page
            const embed = new EmbedBuilder()
                .setTitle(':receipt: Recipes')
                .setColor('DarkGold')
                .setDescription(`Available recipes (Page ${pageNumber}/${totalPages})`);
    
            // Add each recipe and its ingredients to the embed
            for (let i = startIndex; i < endIndex; i++) {
                const recipe = recipes[i];
    
                // Check if the recipe is defined
                if (!recipe) {
                    continue;
                }
    
                // Extract information from the recipe
                const recipeName = recipe.name;
                const ingredients = recipe.ingredients.map(({ materialId, materialName, amount }) =>
                    `${materialName} x ${amount}`
                ).join(', ');
    
                // Add information to the embed
                embed.addFields({
                    name: `${recipe.emoji} ${recipeName} - ${ingredients}`,
                    value: `Result: ${recipe.output.amount} ${recipe.output.item}`,
                });
            }
    
            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
            .setCustomId(`previousPageRec_${Math.max(1, pageNumber - 1)}`)
            .setLabel('Previous Page')
            .setStyle(4)
            .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
            .setCustomId(`nextPageRec_${pageNumber + 1}`)
            .setLabel('Next Page')
            .setStyle(3)
            .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Create an action row for the buttons
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
                interaction.update({ embeds: [embed], components: [actionRow] });
            } else {
                interaction.reply({ embeds: [embed], components: [actionRow] });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching available recipes.', ephemeral: true });
        }
    }
}
