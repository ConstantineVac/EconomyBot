const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const SERVERS_PER_PAGE = 5; // Adjust as needed

module.exports = {
    name: 'owner-server-report',
    description: 'Report the servers the bot has joined',
    options: [
        {
            name: 'channel',
            type: 7,
            description: 'Optional: Specify a channel to send the report',
            required: false,
        },
    ],
    async execute(interaction, pageNumber = 1, specifiedChannel) {

        try {
            const configCollection = await getDatabase().collection('configuration');
            if (specifiedChannel) {
                await configCollection.updateOne({ name: 'reportChannel' }, { $set: { channelId: specifiedChannel.id } }, { upsert: true });
            }

            const savedChannel = await configCollection.findOne({ name: 'reportChannel' });

            let reportChannel;
            if (specifiedChannel) {
                reportChannel = specifiedChannel;
            } else if (savedChannel) {
                reportChannel = interaction.client.channels.cache.get(savedChannel.channelId);
            } else {
                reportChannel = interaction.channel;
            }


            // Fetch guilds once and use the cached result for pagination
            const guilds = interaction.client.guilds.cache.map((guild) => `${guild.name} (${guild.id})`);
            const totalPages = Math.ceil(guilds.length / SERVERS_PER_PAGE);

            
            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }

            const startIndex = (pageNumber - 1) * SERVERS_PER_PAGE;
            const endIndex = Math.min(startIndex + SERVERS_PER_PAGE, guilds.length);

            const embed = new EmbedBuilder()
                .setTitle(`Server List (Page ${pageNumber}/${totalPages})`)
                .setDescription(`Bot has joined **${guilds.length}** servers`)
                .setColor('#0099ff');
                
                for (let i = startIndex; i < endIndex; i++) {
                    const guildName = guilds[i].split('(')[0].trim(); // Extract the server name without ID
                    embed.addFields({name: `${i + 1}. ${guildName}`, value: `ID: ${guilds[i].split('(')[1].split(')')[0]}`});
                }
                
            embed.setTimestamp(Date.now())

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
            .setCustomId(`previousServer_${Math.max(1, pageNumber - 1)}`)
            .setLabel('Previous Page')
            .setStyle(4)
            .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
            .setCustomId(`nextServer_${pageNumber + 1}`)
            .setLabel('Next Page')
            .setStyle(3)
            .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Add pagination buttons to the row
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);
            
            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
                interaction.update({ embeds: [embed], components: [actionRow] });
            } else {
                // Reply to the specified report channel or the original channel if not set
                reportChannel.send({ embeds: [embed], components: [actionRow] });
            }
        } catch (error) {
            console.error('Error saving report to database:', error);
            interaction.reply({ content: 'There was an error saving the report to the database.', ephemeral: true });
        }
    },
};
