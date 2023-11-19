const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database');

let username;

module.exports = {
    name: 'admin-check',
    description: 'Inspect the inventory, secondary inventory, or balance of a user',
    options: [
        {
            name: 'target_user',
            description: 'The user to inspect',
            type: 6, // USER type
            required: true,
        },
        {
            name: 'inventory_type',
            description: 'Select the inspection type',
            type: 3, // STRING type
            required: true,
            choices: [
                { name: 'Inventory', value: 'inventory' },
                { name: 'Secondary Inventory', value: 'secondary_inventory' },
                { name: 'Balance', value: 'balance' },
            ],
        },
    ],
    async execute(interaction) {
        // Get the target user and inventory type from the interaction options
        const targetUser = interaction.options.getUser('target_user');
        //console.log(targetUser.username);
        username = targetUser.username;
        const inventoryType = interaction.options.getString('inventory_type');

        // Check if the user has the required role (replace ROLE_ID with the actual role ID)
        if (
            !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST1) &&
            !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_TEST2) &&
            !interaction.member.roles.cache.has(process.env.MODERATOR_ROLE_ELENI)
        ) {
            return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
        }

        if (!targetUser || !inventoryType) {
            return interaction.reply('Please provide a user and select an inventory type.');
        }

        // Retrieve user data from the database
        const user = await getDatabase().collection('users').findOne({ _id: targetUser.id });

        if (!user) {
            return interaction.reply('User not found.');
        }

        // Determine which inspection type to perform
    let embed;

    if (inventoryType === 'inventory') {
        embed = createInventoryEmbed(targetUser, 'inventory', user);

    } else if (inventoryType === 'secondary_inventory') {
        embed = createInventoryEmbed(targetUser, 'secondary_inventory', user);

    } else if (inventoryType === 'balance') {
        embed = await createBalanceEmbed(user, targetUser);

    } else {
        return interaction.reply('Invalid inspection type.');
    }

    // Check if embed is defined before sending the reply
    if (embed) {
        // Send the embed to the user
        interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        return interaction.reply('Failed to create the embed. Please try again.');
    }

        // Send the embed to the user
        //interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

// Helper function to format inventory items for display
function formatInventory(inventory) {
    if (!inventory || inventory.length === 0) {
        return 'No items';
    }

    const inventoryMap = new Map();

    // Group items by name and sum quantities
    inventory.forEach((item) => {
        const key = `${item.name} - ${item.emoji}`;
        const quantity = inventoryMap.get(key) || 0;
        inventoryMap.set(key, quantity + 1);
    });

    // Format the items for display
    return Array.from(inventoryMap.entries())
        .map(([item, quantity]) => `${item} x ${quantity}`)
        .join('\n');
}

// Helper function to create an inventory or balance embed
// Helper function to create an inventory or balance embed
function createInventoryEmbed(targetUser, inventoryName, user) {
    //console.log(`Username-Embed1: ${targetUser.tag}`);
    const embed = new EmbedBuilder()
        .setColor(0x00FF00) // Green color
        .setTitle(`${inventoryName} Inspection - ${targetUser.tag}`)
        .addFields({ name: inventoryName, value: `${formatInventory(user[inventoryName.toLowerCase()])}` })
        .setTimestamp();

    return embed;
}


// Helper function to create a balance embed
async function createBalanceEmbed(user, targetUser) {
    try {
        //console.log(`Username-Embed2: ${targetUser.tag}`);
        const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        // Load data for each category from the info collection
        const categories = ['cash', 'bank', 'stash', 'balance', 'currentJob'];
        const categoryData = {};

        // Use Promise.all to concurrently fetch data for all categories
        await Promise.all(categories.map(async (category) => {
            const categoryInfo = await getDatabase().collection('info').findOne({ name: category });
            categoryData[category] = categoryInfo?.data || {};
        }));

        //console.log(categoryData);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00) // Green color
            .setTitle(`Balance Inspection - ${targetUser.tag}`)
            .addFields(
                { name: `${categoryData.cash?.emoji} ${categoryData.cash?.name}`, value: formattedCash || '0', inline: true },
                { name: `${categoryData.bank?.emoji} ${categoryData.bank?.name}`, value: formattedBank || '0', inline: true },
                { name: `${categoryData.stash?.emoji} ${categoryData.stash?.name}`, value: user.stash.toString() || '0', inline: true },
            )
            .setTimestamp();

        return embed;
    } catch (error) {
        console.error(error);
        throw new Error('Error fetching category data from the info collection.');
    }
}

//console.log(username);
