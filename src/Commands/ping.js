module.exports = {
    // The name of the command
    name: 'ping',
    // A description of the command
    description: 'Check the bot\'s latency',
    // The function to execute when the command is called
    async execute(interaction) {
        // Send a reply to the interaction
        const reply = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        // Calculate the latency
        const ping = reply.createdTimestamp - interaction.createdTimestamp;

        // Edit the reply to include the latency
        await interaction.editReply(`Pong! Latency is ${ping}ms.`);
    },
};
