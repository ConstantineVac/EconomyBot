const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'List all Economy Bot\'s commands',
    async execute(interaction) {
        // Convert commands to an array for sorting
        const commands = Array.from(interaction.client.commands.values());

        // Sort commands alphabetically by name
        commands.sort((a, b) => a.name.localeCompare(b.name));

        // Separate commands into user and admin categories
        const userCommands = [];
        const adminCommands = [];

        commands.forEach((command, index) => {
            // Check if the command name includes "admin" and user has the admin role
            if (command.name.toLowerCase().includes('admin') && (
                interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST) ||
                interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)
            )) {
                adminCommands.push({ index: index + 1, command });
            } else {
                userCommands.push({ index: index + 1, command });
            }
        });

        // Create a new embed for user commands
        const userEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('**User Commands:**');
        userCommands.forEach(({ index, command }) => {
            userEmbed.addFields({ name: `${index}. /${command.name}`, value: command.description });
        });

        // Send the user embed to the user
        await interaction.reply({ embeds: [userEmbed], ephemeral: true });

        // If there are admin commands, send the admin embed as a follow-up
        if (adminCommands.length > 0) {
            const adminEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('**Admin Commands:**');
            adminCommands.forEach(({ index, command }) => {
                adminEmbed.addFields({ name: `${index}. /${command.name}`, value: command.description });
            });

            await interaction.followUp({ embeds: [adminEmbed], ephemeral: true });
        }
    },
};
