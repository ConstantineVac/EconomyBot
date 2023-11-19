const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'List all Economy Bot\'s commands',
    async execute(interaction) {
        // Convert commands to an array for sorting
        const commands = Array.from(interaction.client.commands.values());

        // Sort commands alphabetically by name
        commands.sort((a, b) => a.name.localeCompare(b.name));

        // Check if the user has the specific role
        const hasSpecificRole = interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) ||
                                interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2) ||
                                interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI);

        // Separate commands into user and admin categories
        const userCommands = [];
        const adminCommands = [];

        commands.forEach((command) => {
            // Check if the command name starts with "admin"
            if (command.name.toLowerCase().startsWith('admin')) {
                adminCommands.push(command);
            } else {
                userCommands.push(command);
            }
        });

        // Create embed for user commands
        const userEmbed = new EmbedBuilder().setColor(0x0099FF).setTitle('**User Commands:**');
        userCommands.forEach((command, index) => {
            userEmbed.addFields({ name: `${index + 1}. /${command.name}`, value: command.description });
        });

        // Send the user embed to the user
        await interaction.reply({ embeds: [userEmbed], ephemeral: true });

        // If the user has the specific role, create and send the admin embed as a follow-up
        if (hasSpecificRole && adminCommands.length > 0) {
            const adminEmbed = new EmbedBuilder().setColor(0xFF0000).setTitle('**Admin Commands:**');
            adminCommands.forEach((command, index) => {
                adminEmbed.addFields({ name: `${index + 1}. /${command.name}`, value: command.description });
            });

            await interaction.followUp({ embeds: [adminEmbed], ephemeral: true });
        }
    },
};
