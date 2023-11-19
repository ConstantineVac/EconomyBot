const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder } = require('discord.js');
const { getDatabase } = require('../database');

const ITEMS_PER_PAGE = 5;


module.exports = {
    name: 'shop',
    description: 'Choose a shop',
    async execute(interaction, pageNumber = 1) {
        try {
            // Retrieve unique store names from the items collection
            const uniqueStoreNames = await getUniqueStoreNames();

            if (uniqueStoreNames.length === 0) {
                return interaction.reply({ content: 'No stores found.', ephemeral: true });
            }

            // Retrieve all items.
            //const itemList = await getDatabase().collection('items').find().toArray();

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

            // Based on the store selected load the correct shop with all the items whose field store has the name of the selection
            const shopSelection = await interaction.channel.awaitMessageComponent({
                filter: i => i.customId === 'shop_selection' && i.user.id === interaction.user.id,
                //time: 30000, // 30 seconds timeout
            });

            if (!shopSelection) {
                return interaction.followUp('Shop selection timed out.');
            }

            const selectedShopName = shopSelection.values[0];
            const selectedShop = uniqueStoreNames.find(shop => shop.name === selectedShopName);

            // Load items from the selected store to embed
            const shopItems = await getDatabase().collection('items').find({
                store: selectedShopName,
                isForSale: true,
            }).toArray();
            
            // Calculate the total number of pages
            const totalPages = Math.ceil(shopItems.length / ITEMS_PER_PAGE);

            // Retrieve the page number from the interaction (default to 1 if not provided)
            if (interaction.options) {
                pageNumber = parseInt(interaction.options.getString('page')) || pageNumber;
            }

            // Calculate the start and end indices for the current page
            const startIndex = (pageNumber - 1) * ITEMS_PER_PAGE;
            const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, shopItems.length);

            const embed = new EmbedBuilder()
                .setTitle(`🏪 ${selectedShopName}`)
                .setThumbnail('https://i.postimg.cc/g2X1Qfkq/shop.png')
                .setColor('DarkRed')
                .setDescription(`Available items in the shop (Page ${pageNumber}/${totalPages})`);

            const itemsRow = new ActionRowBuilder();
            const navigationRow = new ActionRowBuilder();

            for (let i = startIndex; i < endIndex; i++) {
                const item = shopItems[i];

                embed.addFields({
                    name: `${item.emoji} **${item.name}** - 🪙 **${item.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}**`,
                    value: ` Quantity: 1pcs`
                });

                const button = new ButtonBuilder()
                    .setCustomId(`${item.id}`)
                    .setLabel(`🛒 ${item.name}`)
                    .setStyle(3);

                itemsRow.addComponents(button);
                //console.log(button)
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
                interaction.update({ embeds: [embed], components: [itemsRow, navigationRow], ephemera: true });
            } else {
                interaction.followUp({ embeds: [embed], components: [itemsRow, navigationRow], ephemeral: true});
            }
        } catch (error) {
            console.error(error);
            interaction.followUp({ content: 'An error occurred while fetching store names.', ephemeral: true });
        }
    },
};


// Function to retrieve unique store names from the items collection
async function getUniqueStoreNames() {
    const itemsCollection = getDatabase().collection('items');
    const uniqueStoreNames = await itemsCollection.distinct('store');
    return uniqueStoreNames.filter(Boolean); // Remove any falsy values (null, undefined, etc.)
}
