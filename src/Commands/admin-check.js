const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, InteractionType } = require('discord.js');
const { getDatabase } = require('../database');

let ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'admin-check',
    description: 'Inspect the inventory, secondary inventory, or balance of a user',
    options: [
        {
            name: 'target_user',
            description: 'User to inspect',
            type: 6, // USER type
            required: true,
        },
        {
            name: 'inventory_type',
            description: 'Select one',
            type: 3, // STRING type
            required: true,
            choices: [
                { name: 'Primary Inventory', value: 'inventory' },
                { name: 'Storage', value: 'secondaryInventory' },
                { name: 'Balance', value: 'balance' },
            ],
        },
    ],
    async execute(interaction, pageNumber = 1) {
        try {
            // Get the configuration from the database
            const config = await getDatabase().collection('configuration').findOne({ name: 'admin' });

            // Get the admin roles from the configuration
            const adminRoles = config.data.adminRoles;

            // Check if the user has any of the admin roles
            const hasRole = interaction.member.roles.cache.some(role => adminRoles.includes(role.id));
            if (!hasRole) {
                return interaction.reply({ content: 'You do not have the required role to use this command.', ephemeral: true });
            }

            let action, targetUser, inventoryType, newPage;

            // Check if this is a button interaction
            if (interaction.isButton()) {
                // Parse the custom ID
                [action, targetUser, inventoryType, newPage] = interaction.customId.split('_');
                // Convert the page number to an integer
                pageNumber = parseInt(newPage);
            } else {
                // Get the target user and inventory type from the interaction options
                targetUser = interaction.options.getUser('target_user').id;
                inventoryType = interaction.options.getString('inventory_type');
            }

            // Retrieve user's inventory from the database
            const user = await getDatabase().collection('users').findOne({ _id: targetUser });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }


            let userInventory;
            if (inventoryType === 'inventory' || inventoryType === 'secondaryInventory') {
                if (inventoryType === 'inventory') {
                    userInventory = user.inventory;
                } else {
                    userInventory = user.secondaryInventory;
                }
                
                //console.log(inventoryType)
                // Check if the user has items in the inventory
                if (!userInventory || userInventory.length === 0) {
                    return interaction.reply({content: `Your ${inventoryType === 'secondaryInventory' ? 'chest' : 'inventory'} is empty.`, ephemeral: true});
                }

                // Retrieve inventory info from the collection info
                const collectionInfo = await getDatabase().collection('info').findOne({ name: inventoryType });

                // Create a map to count the occurrences of each itemId
                const itemQuantityMap = new Map();
                userInventory.forEach((item) => {
                    const itemId = item.itemId;
                    itemQuantityMap.set(itemId, (itemQuantityMap.get(itemId) || 0) + 1 );
                });

                // Calculate the total number of pages
                const totalPages = Math.ceil(itemQuantityMap.size / ITEMS_PER_PAGE);

                //console.log(`Interaction Options : ${interaction.options}`)
                // console.log(interaction.options)

                // Retrieve the page number from the interaction (default to 1 if not provided)
                if (interaction.options && interaction.options._hoistedOptions) {
                    const pageOption = interaction.options._hoistedOptions.find(option => option.name === 'page');
                    pageNumber = parseInt(pageOption?.value) || pageNumber;
                    console.log(`Page Number : ${pageNumber}`);
                }

                console.log(interaction.options && interaction.options.page);

                // Calculate the start and end indices for the current page
                const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
                const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, itemQuantityMap.size);

                // Customize thumbnail URL based on inventory info
                const thumbnailURL = collectionInfo?.data?.url || 'https://i.postimg.cc/m2WXXt1j/backpack.png';

                // Create an embed to display the user's inventory for the current page
                const embed = new EmbedBuilder()
                    .setTitle(`🎒 ${user.username}'s ${collectionInfo?.data?.name || inventoryType}`)
                    .setThumbnail(thumbnailURL)
                    .setColor('DarkRed')
                    .setDescription(`Admin Inspection for user's ${collectionInfo?.data?.name || inventoryType} (Page ${pageNumber}/${totalPages})`);

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
                    .setCustomId(`previousAd_${targetUser}_${inventoryType}_${Math.max(1, pageNumber - 1)}`)
                    .setLabel('Previous Page')
                    .setStyle(4)
                    .setDisabled(pageNumber === 1); // Disable if this is the first page

                const nextButton = new ButtonBuilder()
                    .setCustomId(`nextAd_${targetUser}_${inventoryType}_${pageNumber + 1}`)
                    .setLabel('Next Page')
                    .setStyle(3)
                    .setDisabled(pageNumber === totalPages); // Disable if this is the last page

                const balanceButton = new ButtonBuilder()
                    .setCustomId(`showBalance_${targetUser}`)
                    .setLabel(`Show user's Balance`)
                    .setStyle(1)

                // Create an action row for the buttons
                const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton, balanceButton);

                // Check if this is a button interaction and update the message
                if (interaction.isButton()) {
                    interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
                } else {
                    interaction.reply({ embeds: [embed], components: [actionRow], ephemeral:true });
                }

            } else {
                userInventory = { balance: { cash: user.cash, bank: user.bank } };
                //console.log({content: userInventory})
                // Load data for each category from the info collection
                const categories = ['cash', 'bank', 'stash', 'balance', 'currentJob'];
                const categoryData = {};

                for (const category of categories) {
                    const categoryInfo = await getDatabase().collection('info').findOne({ name: category });
                    categoryData[category] = categoryInfo?.data || {};
                }
                // Format the money for better readability
                const formattedCash = user.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                const formattedBank = user.bank.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                const formattedStash = user.stash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

                // Create an embed to display the user's balance
                const embed = new EmbedBuilder()
                    .setTitle('Admin Account Inspection')
                    .setDescription(`For User: ${user.username}`)
                    .setThumbnail(`${categoryData.balance.url}`)
                    .setColor('Green')
                    .addFields(
                        { name: `${categoryData.cash?.emoji} ${categoryData.cash?.name}`, value: formattedCash || '0', inline: true },
                        { name: `${categoryData.bank?.emoji} ${categoryData.bank?.name}`, value: formattedBank || '0', inline: true },
                        { name: `${categoryData.stash?.emoji} ${categoryData.stash?.name}`, value: formattedStash || '0', inline: true },
                        { name: `${categoryData.currentJob?.emoji} ${categoryData.currentJob?.name}`, value: user.currentJob ? user.currentJob.name : 'Unemployed', inline: true },
                    );

                // Send the embed as a reply
                interaction.reply({ embeds: [embed], ephemeral: true });
                }

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching your inventory.', ephemeral: true });
        }
    },
};