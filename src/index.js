require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { connect, getDatabase } = require('./database');  // Import the connect function from the database module
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder} = require('discord.js'); 
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
const clientId = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let commands = [];

// client.once('ready', async () => {
//     console.log('✅ Bot is online!');
    
//     // Connect to the database
//     await connect();

//     // Fetch the recipes from the database
//     const recipes = await getDatabase().collection('recipes').find().toArray();
    
//     // Map the recipes to the format needed for choices
//     const choicesRecipes = recipes.map(recipe => ({ name: recipe.name, value: recipe.name }));
    
//     // Construct the path to the Commands directory
//     const commandsDirectory = path.join(__dirname, 'Commands');

//     client.commands = new Collection();

//     const commandFiles = fs.readdirSync(commandsDirectory).filter(file => file.endsWith('.js'));

//     for (const file of commandFiles) {
//         const command = require(path.join(commandsDirectory, file));
//         // If this is the 'craft' command, modify its options
//         if (command.name === 'craft') {
//             command.options[0].choices = choicesRecipes;
//         }
//         client.commands.set(command.name, command);
//     }
    
//     const commands = Array.from(client.commands.values()).map(command => ({
//         name: command.name,
//         description: command.description,
//         options: command.options,
//     }));
    
//     // Set all commands as global commands
//     await client.application.commands.set(commands);
//     console.log('✅ All commands have been registered globally!');
// });


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
    
    const commands = Array.from(client.commands.values()).map(command => ({
        name: command.name,
        description: command.description,
        options: command.options,
    }));

    // Set the commands for each joined guild
    client.guilds.cache.each(async guild => {
        await guild.commands.set(commands);
    });

    console.log('✅ All commands have been registered for each joined guild!');
});

// register commands to new server.
client.on('guildCreate', async (guild) => {
    console.log(`Joined a new guild: ${guild.id}`);
    
    // Re-read the command files
    const commandFiles = fs.readdirSync(path.join(__dirname, 'Commands')).filter(file => file.endsWith('.js'));

    // Re-construct the commands
    const commands = commandFiles.map(file => {
        const command = require(path.join(__dirname, 'Commands', file));
        return {
            name: command.name,
            description: command.description,
            options: command.options, // Assuming 'options' is a property in your command file
        };
    });

    // Register the commands in the new guild
    try {
        await guild.commands.set(commands);
        console.log('Commands registered in the new guild.');
    } catch (error) {
        console.error(`Error registering commands in the new guild: ${error.message}`);
    }
});





client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        // Dynamically import the button click event handler
        const handleButtonClick = require('./eventHandlers/buttonClick');
        handleButtonClick(interaction);  
    } else {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
            await interaction.respond({ content: 'An error occurred while fetching autocomplete choices.', ephemeral: true });
        }
    }
});


client.login(process.env.TOKEN);
