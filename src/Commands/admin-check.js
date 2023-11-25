const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, InteractionType } = require('discord.js');
const { getDatabase } = require('../database');

let username;
let ITEMS_PER_PAGE = 5;

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
                { name: 'Secondary Inventory', value: 'secondaryInventory' },
                { name: 'Balance', value: 'balance' },
            ],
        },
    ],
    async execute(interaction) {
        // Get the target user and inventory type from the interaction options
        const targetUser = interaction.options.getUser('target_user');
        //console.log(targetUser.username);

        //username = targetUser.username;

        const inventoryType = interaction.options.getString('inventory_type');
        console.log(`type of inventory : ${inventoryType}`)
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
            embed = await createInventoryEmbed(interaction, targetUser, inventoryType);
        
        } else if (inventoryType === 'secondaryInventory') {
            embed = await createInventoryEmbed(interaction, targetUser, inventoryType);
        
        } else if (inventoryType === 'balance') {
            embed = await createBalanceEmbed(user, targetUser);
        
        } else {
            return interaction.reply('Invalid inspection type.');
        }
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
async function createInventoryEmbed(interaction, targetUser, inventoryType) {
    try {
        let pageNumber = 1
        // Retrieve user's inventory from the database
        const user = await getDatabase().collection('users').findOne({ _id: targetUser.id });
        console.log(user)

        // Check if the user exists
        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        console.log([user, user.inventory, user.secondaryInventory, inventoryType])
        // Check if the user has items in the inventory

        const userInventory = inventoryType !== 'secondaryInventory' ? user.inventory : user.secondaryInventory;
        if (!userInventory || userInventory.length === 0) {
            return interaction.reply({ content: `${user.id}'s ${inventoryType === 'secondaryIinventory' ? 'secondaryInventory' : 'inventory'} is empty.`, ephemeral: true });
        }

        // Retrieve inventory info from the collection info
        const collectionInfo = await getDatabase().collection('info').findOne({ name: inventoryType });
        console.log(collectionInfo)
        // Create a map to count the occurrences of each itemId
        const itemQuantityMap = new Map();
        userInventory.forEach((item) => {
            const itemId = item.itemId;
            itemQuantityMap.set(itemId, (itemQuantityMap.get(itemId) || 0) + 1);
        });

        console.log('Item Quantity Map:', itemQuantityMap);


        // Calculate the total number of pages
        const ITEMS_PER_PAGE = 5; // Adjust as needed
        const totalPages = Math.ceil(itemQuantityMap.size / ITEMS_PER_PAGE);

        console.log('ITEMS_PER_PAGE:', ITEMS_PER_PAGE);
        console.log('Item Quantity Map Size:', itemQuantityMap.size);
        console.log('Total Pages:', totalPages);


        // Retrieve the page number from the interaction (default to 1 if not provided)
        if (interaction.options) {
            pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
        }

        // Calculate the start and end indices for the current page
        const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
        let endIndex = Math.min(startIndex + ITEMS_PER_PAGE, itemQuantityMap.size);

        // Update the calculation for endIndex
        if (pageNumber * ITEMS_PER_PAGE > itemQuantityMap.size) {
            endIndex = itemQuantityMap.size;
        }

        
        console.log('Start Index:', startIndex);
        console.log('End Index:', endIndex);


        // Customize thumbnail URL based on inventory info
        const thumbnailURL = collectionInfo?.data?.url || 'https://i.postimg.cc/m2WXXt1j/backpack.png';

        // Create an embed to display the user's inventory for the current page
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s ${collectionInfo?.data?.name || inventoryType}`)
            .setThumbnail(thumbnailURL)
            .setColor('Green')
            .setDescription(`Items in your ${collectionInfo?.data?.name || inventoryType} (Page ${pageNumber}/${totalPages})`);

        // Add each item to the embed
        let itemNumber = (pageNumber - 1) * ITEMS_PER_PAGE + 1;
        for (let i = startIndex; i < endIndex; i++) {
            const itemId = Array.from(itemQuantityMap.keys())[i];
            const quantity = itemQuantityMap.get(itemId);

            // Retrieve the item from the items collection using itemId
            const item = await getDatabase().collection('items').findOne({ id: itemId });

            // Check if item is defined
            if (item) {
                embed.addFields({
                    name: `${item.emoji} ${itemNumber}. **${item.name}**`,
                    value: `Quantity: **${quantity}**`,
                });
                itemNumber++;
            }
        }

        // Create buttons for navigating between pages
        const previousButton = new ButtonBuilder()
            .setCustomId(`previousPageInv_${inventoryType}_${pageNumber}`)
            .setLabel('Previous Page')
            .setStyle(4)
            .setDisabled(pageNumber === 1); // Disable if this is the first page

        const nextButton = new ButtonBuilder()
            .setCustomId(`nextPageInv_${inventoryType}_${pageNumber + 1}`)
            .setLabel('Next Page')
            .setStyle(3)
            .setDisabled(pageNumber === totalPages); // Disable if this is the last page

        // Create an action row for the buttons
        const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

        // Check if this is a button interaction and update the message
        if (interaction.isButton()) {
            await interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
        }
    } catch (error) {
        console.error(error);
        // Check if interaction still exists before replying
        if (interaction.replied) {
            console.warn('Interaction has already been acknowledged or replied to.');
        } else {
            await interaction.reply({ content: 'There was an error fetching your inventory.', ephemeral: true });
        }
    }
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
