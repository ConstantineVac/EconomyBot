const { getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'use',
    description: 'Use an item',
    options: [
        {
            name: 'item_name',
            type: 3,
            description: 'The name of the item to use',
            required: true,
        },
    ],
    async execute(interaction) {
        // Retrieve user input
        const itemName = interaction.options.getString('item_name');
        console.log(itemName);

        // Fetch item from the 'items' collection based on the name
        const item = await getDatabase().collection('items').findOne({ name: itemName });
        console.log(item);

        // Check if the item exists
        if (!item) {
            return interaction.reply({ content: `Item: ${itemName} not found.`, ephemeral: true });
        }

        // Retrieve the user from the 'users' collection
        const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

        // Check if the user exists
        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        // Fetch the item from the user's inventory based on the item id
        const userInventoryItem = user.inventory.find(invItem => invItem.itemId === item.id);

        // Check if the item exists in the user's inventory
        if (!userInventoryItem) {
            return interaction.reply({ content: `Item: ${itemName} not found in your inventory.`, ephemeral: true });
        }

        // Check if the item has an on-use action
        if (!item.onUse) {
            return interaction.reply({ content: `Item: ${itemName} does not have an on-use action.`, ephemeral: true });
        }

        // Execute the on-use actions
        if (item.onUse.sendMessage) {
            await interaction.reply({ content: item.onUse.sendMessage, ephemeral: true });
        }

        const itemToRemove = item.id

        if (item.onUse.addBalance) {
            // Remove the first object with itemId equal to item.id from the inventory array
            let found = false;
            user.inventory = user.inventory.filter(item => {
                if (!found && item.itemId === itemToRemove) {
                    found = true;
                    return false;
                }
                return true;
            });

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: user.inventory } });

            if (item.isIllegal) {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { stash: item.onUse.addBalance } });
            } else {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { cash: item.onUse.addBalance } });
            }
        }
        if (item.onUse.deductBalance) {

            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
            const inventory = user.inventory;
             // Check if the inventory exists
            if (!inventory) {
                return interaction.reply({ content: 'Inventory not found.', ephemeral: true });
            }

            // Remove the first object with itemId equal to item.id from the inventory array
            let found = false;
            user.inventory = user.inventory.filter(item => {
                if (!found && item.itemId === itemToRemove) {
                    found = true;
                    return false;
                }
                return true;
            });

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: user.inventory } });

            if (item.isIllegal) {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { stash: -item.onUse.deductBalance } });
            } else {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { cash: -item.onUse.deductBalance } });
            }
            
        }
        if (item.onUse.grantRole) {
            // Remove the first object with itemId equal to item.id from the inventory array
            let found = false;
            user.inventory = user.inventory.filter(item => {
                if (!found && item.itemId === itemToRemove) {
                    found = true;
                    return false;
                }
                return true;
            });

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: user.inventory } });

            // Extract role ID from the mention
            const roleId = item.onUse.grantRole.match(/\d+/)[0];

            // Find the role by ID
            const role = interaction.guild.roles.cache.get(roleId);

            if (role) {
                const member = interaction.guild.members.cache.get(interaction.user.id);
                await member.roles.add(role);
            }
            
            interaction.followUp(`You have successfully used 1 x ${item.emoji} ${item.name}! Granted ${item.onUse.grantRole}`);
        }
        if (item.onUse.removeRole) {

            // Remove the first object with itemId equal to item.id from the inventory array
            let found = false;
            user.inventory = user.inventory.filter(item => {
                if (!found && item.itemId === itemToRemove) {
                    found = true;
                    return false;
                }
                return true;
            });

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: user.inventory } });

            // Extract role ID from the mention
            const roleId = item.onUse.removeRole.match(/\d+/)[0];
        
            // Find the role by ID
            const role = interaction.guild.roles.cache.get(roleId);
        
            if (role) {
                const member = interaction.guild.members.cache.get(interaction.user.id);
                await member.roles.remove(role);
            }

            interaction.followUp(`You have successfully used 1 x ${item.emoji} ${item.name}! Granted ${item.onUse.removeRole}`);
        }
        if (item.onUse.giveItem) {
            const itemToGive = item.onUse.giveItem
            
            // Fetch item from the 'items' collection based on the name
            const itemToGet = await getDatabase().collection('items').findOne({ name: itemToGive });
            
            // Add the item to the user's inventory
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $push: { inventory: { itemId : itemToGet.id }} });

            interaction.followUp(`You have successfully used 1 x ${item.emoji} ${item.name}! And you have gotten ${itemToGet.name}`);
        }
        if (item.onUse.randomItem) {
            // Select a random item and add it to the user's inventory
            const randomItem = item.onUse.randomItem[Math.floor(Math.random() * item.onUse.randomItem.length)];
            await getDatabase().collection('users').updateOne({ id: interaction.user.id }, { $push: { inventory: randomItem } });
        }

        await interaction.followUp({ content: `You used ${itemName}!`, ephemeral: true });
    },
};
