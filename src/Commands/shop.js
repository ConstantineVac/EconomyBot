// shop.js

const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 5;

module.exports = {
    name: 'shop',
    description: 'Choose a shop',
    async execute(interaction, pageNumber = 1) {
        try {
            // Retrieve unique store names from the 'shop' collection
            const uniqueStoreNames = await getUniqueStoreNames();

            if (uniqueStoreNames.length === 0) {
                return interaction.reply({ content: 'No stores found.', ephemeral: true });
            }

            // Create a row and a select menu with dynamic options
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('shop_selection')
                    .setPlaceholder('Select a shop')
                    .addOptions(uniqueStoreNames.map(store => ({ label: store, value: store })))
            );

            // Send a message with the row and select menu
            await interaction.reply({
                content: 'Choose a shop:',
                components: [row],
                ephemeral: true,
            });

            // Based on the store selected, load the correct shop with all the items
            const shopSelection = await interaction.channel.awaitMessageComponent({
                filter: i => i.customId === 'shop_selection' && i.user.id === interaction.user.id,
                //time: 30000, // 30 seconds timeout
            });

            if (!shopSelection) {
                return interaction.followUp('Shop selection timed out.');
            }

            const selectedShopName = shopSelection.values[0];

            // Load item IDs from the selected shop's items array
            const selectedShop = await getDatabase().collection('shop').findOne({ shop_name: selectedShopName });

            if (!selectedShop || !selectedShop.items || selectedShop.items.length === 0) {
                return interaction.followUp({ content: `No items found in the shop "${selectedShopName}".`, ephemeral: true });
            }
            
            // Fetch item details from the 'items' collection based on the stored item IDs
            const itemDetails = await getItemsDetails(selectedShop.items);

            //console.log(itemDetails)

            // Filter the items where isForSale is true
            const itemsForSale = itemDetails.filter(item => item.isForSale === true);

            if (itemsForSale.length === 0) {
                return interaction.followUp({ content: `No items found in the shop "${selectedShopName}".`, ephemeral: true });
            }

            // Calculate the total number of pages
            const totalPages = Math.ceil(itemsForSale.length / ITEMS_PER_PAGE);

            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, itemsForSale.length);

            const embed = new EmbedBuilder()
                .setTitle(`🏪 ${selectedShopName}`)
                .setThumbnail('https://i.postimg.cc/g2X1Qfkq/shop.png')
                .setColor('DarkRed')
                .setDescription(`Available items in the shop (Page ${pageNumber}/${totalPages})`);

            const itemsRow = new ActionRowBuilder();
            const navigationRow = new ActionRowBuilder();

            for (let i = startIndex; i < endIndex; i++) {
                const item = itemsForSale[i];

                embed.addFields({
                    name: `${item.emoji} **${item.name}** - 🪙 **${item.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}**`,
                    value: ` Quantity: 1pcs`,
                });

                const button = new ButtonBuilder()
                    .setCustomId(`${item.id}`)
                    .setLabel(`🛒 ${item.name}`)
                    .setStyle(3);

                itemsRow.addComponents(button);
            }

            // Create buttons for navigating between pages
            const previousButton = new ButtonBuilder()
                .setCustomId(`previousPageShop_${Math.max(1, pageNumber - 1)}`)
                .setLabel('Previous Page')
                .setStyle(4)
                .setDisabled(pageNumber === 1); // Disable if this is the first page

            const nextButton = new ButtonBuilder()
                .setCustomId(`nextPageShop_${pageNumber + 1}`)
                .setLabel('Next Page')
                .setStyle(3)
                .setDisabled(pageNumber === totalPages); // Disable if this is the last page

            // Add pagination buttons to the row
            navigationRow.addComponents(previousButton, nextButton);

            // Check if this is a button interaction and update the message
            if (interaction.isButton()) {
                interaction.update({ embeds: [embed], components: [itemsRow, navigationRow], ephemeral: true });
            } else {
                interaction.followUp({ embeds: [embed], components: [itemsRow, navigationRow], ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            interaction.followUp({ content: 'An error occurred while fetching store names.', ephemeral: true });
        }
    },
};

// Function to retrieve unique store names from the 'shop' collection
async function getUniqueStoreNames() {
    const shopCollection = getDatabase().collection('shop');
    const uniqueStoreNames = await shopCollection.distinct('shop_name');
    return uniqueStoreNames.filter(Boolean); // Remove any falsy values (null, undefined, etc.)
}

// Function to fetch item details from the 'items' collection based on item IDs
async function getItemsDetails(itemIds) {
    const itemsCollection = getDatabase().collection('items');

    // Extract the 'id' properties from the objects in the array
    const ids = itemIds.map(item => item.id);

   // console.log('Item IDs:', ids); // Add this line for debugging

    // Query the 'items' collection based on the extracted IDs
    const itemDetails = await itemsCollection.find({ id: { $in: ids } }).toArray();
    
    //console.log('Item Details:', itemDetails); // Add this line for debugging

    return itemDetails;
}
