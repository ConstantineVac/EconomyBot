require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connect, getDatabase } = require('./database');  // Import the connect function from the database module
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

    // Fetch the recipes from the database
    const recipes = await getDatabase().collection('recipes').find().toArray();
    //const items = await getDatabase().collection('items').find().toArray();

    // Map the recipes to the format needed for choices
    const choicesRecipes = recipes.map(recipe => ({ name: recipe.name, value: recipe.name }));
    //const choicesItems = items.map(item => ({ name: item.name, value: item.name })); CANNOT LOAD MORE THAN 25


    // Construct the path to the Commands directory
    const commandsDirectory = path.join(__dirname, 'Commands');

    client.commands = new Collection();

    const commandFiles = fs.readdirSync(commandsDirectory).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsDirectory, file));
        // If this is the 'craft' command, modify its options
        if (command.name === 'craft') {
            command.options[0].choices = choicesRecipes;
        } 
        //if (command.name === 'give-item') {
            // Modify 'give-item' command options
            //command.options[2].choices = choicesItems;
        //}
        client.commands.set(command.name, command);
    }

    // Register all commands as slash commands
    const commands = Array.from(client.commands.values()).map(command => ({
        name: command.name,
        description: command.description,
        options: command.options,
    }));

    await client.application.commands.set(commands);
    console.log('✅ All commands have been registered successfully!');
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
