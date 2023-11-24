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
        console.log(itemName)
        const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

        // Fetch item from the user's inventory
        const item = user.inventory.find(invItem => invItem.name === itemName);
        console.log(item)
        if (!item) {
            return interaction.reply({ content: `Item: ${itemName} not found.`, ephemeral: true });
        }

        // Check if the item has an on-use action
        if (!item.onUse) {
            return interaction.reply({ content: `Item: ${itemName} does not have an on-use action.`, ephemeral: true });
        }

        // Execute the on-use actions
        if (item.onUse.sendMessage) {
            await interaction.reply({ content: item.onUse.sendMessage, ephemeral: true });
        }
        if (item.onUse.addBalance) {
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
            const inventory = user.inventory;
             // Check if the inventory exists
            if (!inventory) {
                return interaction.reply({ content: 'Inventory not found.', ephemeral: true });
            }

            let amount = 1;
            let newInventory = inventory.filter(item => !(item.name === itemName && amount-- > 0));

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: newInventory } });

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

            let amount = 1;
            let newInventory = inventory.filter(item => !(item.name === itemName && amount-- > 0));

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: newInventory } });

            if (item.isIllegal) {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { stash: -item.onUse.deductBalance } });
            } else {
                await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $inc: { cash: -item.onUse.deductBalance } });
            }
            
        }
        if (item.onUse.grantRole) {

            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
            const inventory = user.inventory;
             // Check if the inventory exists
            if (!inventory) {
                return interaction.reply({ content: 'Inventory not found.', ephemeral: true });
            }

            let amount = 1;
            let newInventory = inventory.filter(item => !(item.name === itemName && amount-- > 0));

            // Update the user's inventory in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { inventory: newInventory } });

            // Extract role ID from the mention
            const roleId = item.onUse.grantRole.match(/\d+/)[0];
        
            // Find the role by ID
            const role = interaction.guild.roles.cache.get(roleId);
        
            if (role) {
                const member = interaction.guild.members.cache.get(interaction.user.id);
                await member.roles.add(role);
            }
        }
        if (item.onUse.removeRole) {
            // Extract role ID from the mention
            const roleId = item.onUse.removeRole.match(/\d+/)[0];
        
            // Find the role by ID
            const role = interaction.guild.roles.cache.get(roleId);
        
            if (role) {
                const member = interaction.guild.members.cache.get(interaction.user.id);
                await member.roles.remove(role);
            }
        }
        if (item.onUse.giveItem) {
            // Add the item to the user's inventory
            await getDatabase().collection('users').updateOne({ id: interaction.user.id }, { $push: { inventory: item.onUse.giveItem } });
        }
        if (item.onUse.randomItem) {
            // Select a random item and add it to the user's inventory
            const randomItem = item.onUse.randomItem[Math.floor(Math.random() * item.onUse.randomItem.length)];
            await getDatabase().collection('users').updateOne({ id: interaction.user.id }, { $push: { inventory: randomItem } });
        }

        await interaction.followUp({ content: `You used ${itemName}!`, ephemeral: true });
    },
};
