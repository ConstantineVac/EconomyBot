// eventHandlers/buttonClick.js

const { getDatabase } = require('../database');

module.exports = async (interaction) => {
    // Extract action and item id from the button custom id
    const [action, itemId] = interaction.customId.split('_');

    if (action === 'previousPage' || action === 'nextPage') {
        if (action === 'previousPage') {
            console.log('previous button click')
        } else {
            console.log('next button click')
        }
    } else {
        // Extract item id from the button custom id by removing "purchase_"
    const itemId = Number(interaction.customId); // Convert to number

    // Retrieve user balance and item price from the database
    const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

    // Check if the user exists
    if (!user) {
        return interaction.reply({ content: 'User not found.', ephemeral: true });
    }

    // Retrieve the item from the shop collection using the correct field name
    const shopItem = await getDatabase().collection('shop').findOne({ id: itemId });

    // Check if the item exists
    if (!shopItem) {
        return interaction.reply({ content: 'Item not found in the shop.', ephemeral: true });
    }

    const userBalance = user.balance;
    const itemPrice = shopItem.price;

    if (userBalance >= itemPrice) {
        // Deduct price from user's balance and add item to user's inventory
        await getDatabase().collection('users').updateOne(
            { _id: interaction.user.id },
            { 
                $inc: { balance: -itemPrice },
                $push: { inventory: { id: itemId, name: shopItem.name } }
            }
        );

        interaction.reply(`You have successfully purchased 1 x ${shopItem.name}!`);
    } else {
        interaction.reply(`You do not have enough balance to purchase this item.`);
    }
}
};

