// Import the necessary module
const { EmbedBuilder } = require('discord.js');

module.exports = {
    // The name of the command
    name: 'help',
    // A description of the command
    description: 'List all commands',
    // The function to execute when the command is called
    async execute(interaction) {
        // Create a new embed message
        const embed = new EmbedBuilder()
            .setColor(0x0099FF) // Set the color of the embed
            .setTitle('Commands List'); // Set the title of the embed

        // Loop over all commands and add them to the embed
        interaction.client.commands.forEach((command) => {
            embed.addFields({ name: `/${command.name}`, value: command.description });
        });

        // Send the embed to the user
        interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
