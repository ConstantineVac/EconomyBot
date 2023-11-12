require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connect } = require('./database');  // Import the connect function from the database module
const { Client, GatewayIntentBits, Collection } = require('discord.js'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', async () => {
    console.log('✅ Bot is online!');
    
    // Connect to the database
    await connect();

    // Construct the path to the Commands directory
    const commandsDirectory = path.join(__dirname, 'Commands');

    client.commands = new Collection();

    const commandFiles = fs.readdirSync(commandsDirectory).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsDirectory, file));
        client.commands.set(command.name, command);
    }

    // Register all commands as slash commands
    const commands = Array.from(client.commands.values()).map(command => ({
        name: command.name,
        description: command.description,
        options: command.options,
    }));

    await client.guilds.cache.get(process.env.GUILD_ID).commands.set(commands);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Dynamically import the button click event handler
    const handleButtonClick = require('./eventHandlers/buttonClick');
    handleButtonClick(interaction);
});

client.login(process.env.TOKEN);
