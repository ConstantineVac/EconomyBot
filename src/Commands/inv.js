const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');
const ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'inv',
    description: 'View your inventory',
    options: [
        {
            name: 'inventory_type',
            description: 'Select the inventory type',
            type: 3, // String type
            required: true,
            choices: [
                { name: 'Inventory', value: 'inventory' },
                { name: 'Chest', value: 'secondaryInventory' },
            ],
        },
    ],    
    async execute(interaction, pageNumber = 1) {
        try {
            // Retrieve user's inventory from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Determine which inventory to use based on the selected type
            let inventoryType;
            if (interaction.options && interaction.options._hoistedOptions) {
                const inventoryTypeOption = interaction.options._hoistedOptions.find(option => option.name === 'inventory_type');
                inventoryType = inventoryTypeOption?.value;
            }

            const userInventory = inventoryType === 'secondaryInventory' ? user.secondaryInventory : user.inventory;


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
                .setTitle(`🎒 ${collectionInfo?.data?.name || inventoryType}`)
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
                .setCustomId(`previousPageInv_${Math.max(1, pageNumber - 1)}`)
                .setLabel('Previous Page')
                .setStyle(4)
                .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
                .setCustomId(`nextPageInv_${pageNumber + 1}`)
                .setLabel('Next Page')
                .setStyle(3)
                .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Create an action row for the buttons
            const actionRow = new ActionRowBuilder().addComponents(previousButton, nextButton);

            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
                interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
            } else {
                interaction.reply({ embeds: [embed], components: [actionRow], ephemeral:true });
            }
        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'There was an error fetching your inventory.', ephemeral: true });
        }
    },
};
