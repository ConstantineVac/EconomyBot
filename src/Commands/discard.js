// discard.js /discard 
const { getDatabase } = require('../database');

module.exports = {
    name: 'discard',
    description: 'Discard an item',
    options: [
        {
            name: 'item',
            description: 'Choose item to discard',
            type: 3, // String
            required: true
        },
        {
            name: 'inventory',
            description: 'Choose inventory to discard from',
            type: 3, // String
            required: true,
            choices: [
                { name: 'Inventory', value: 'inventory' },
                { name: 'Secondary Inventory', value: 'secondaryInventory' },
            ],
        },
        {
            name: 'amount',
            description: 'Amount of items to discard',
            type: 4, // Integer
            required: true,
        },
    ],
    async execute(interaction) {
        // Get the options from the interaction
        const itemName = interaction.options.getString('item');
        const inventoryName = interaction.options.getString('inventory');
        let amount = interaction.options.getInteger('amount');

        // Fetch the user from the database
        const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

        // Check if the user exists
        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }

        // Get the inventory from the user
        const inventory = user[inventoryName];
        //console.log(inventory)

        // Check if the inventory exists
        if (!inventory) {
            return interaction.reply({ content: 'Inventory not found.', ephemeral: true });
        }

        let originalAmount = amount;
        let newInventory = inventory.filter(item => !(item.name === itemName && amount-- > 0));
        //console.log(newInventory);
        

        // Update the user's inventory in the database
        await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { [inventoryName]: newInventory } });

        // Reply to the interaction
        interaction.reply(`Successfully discarded ${originalAmount} ${itemName} from your ${inventoryName}.`);
    },
};