// discard.js /discard 
const { getDatabase } = require('../database');

module.exports = {
    name: 'discard',
    description: 'Discard an item',
    options: [
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
            name: 'item',
            description: 'Choose item to discard',
            type: 3, // String
            required: true,
            choices: [],
            autocomplete: true,
        },
        {
            name: 'amount',
            description: 'Amount of items to discard',
            type: 4, // Integer
            required: true,
        },
    ],
    autocomplete: async function (interaction) {
        try {
            // Retrieve user's inventory from the database
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
    
            // Check if the user exists
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }
    
            // Extract the user's selected inventory type
            const selectedInventoryType = interaction.options.getString('inventory');
    
            // Extract the chosen inventory array from the user
            const userInventory = user[selectedInventoryType];
    
            // // Check if the chosen inventory type is valid
            // if (!userInventory) {
            //     return interaction.reply({ content: 'Invalid inventory type.', ephemeral: true });
            // }
    
            // // Check if the chosen inventory is empty
            // if (userInventory.length === 0) {
            //     return interaction.reply({ content: `Your ${selectedInventoryType === 'inventory' ? 'primary inventory' : 'secondary inventory'} is empty.`, ephemeral: true });
            // }
    
            // Extract itemIds from the chosen inventory
            const itemIds = userInventory.map(item => item.itemId);
    
            // Retrieve items from the database using itemIds
            const itemsFromDatabase = await getDatabase().collection('items').find({ id: { $in: itemIds } }).toArray();
    
            // Create a map to count the occurrences of each itemId
            const itemQuantityMap = new Map();
            userInventory.forEach((item) => {
                const itemId = item.itemId;
                itemQuantityMap.set(itemId, (itemQuantityMap.get(itemId) || 0) + 1);
            });
    
            // Map the items to the format needed for choices
            const choicesItems = itemsFromDatabase.map(item => {
                const itemId = item.id; // Assuming id is the property in the item object representing the itemId
                const itemName = item.name; // Assuming name is the property in the item object representing the itemName
                const quantity = itemQuantityMap.get(itemId) || 0;
                return {
                    name: `${itemName} x${quantity}`,
                    value: itemName, // Adjust this based on your requirement
                };
            });

             // Include an "empty" choice if the inventory is empty
            if (userInventory.length === 0) {
                choicesItems.push({ name: 'Empty', value: 'empty', disabled: true });
            }
    
            // Get the user's input
            const userInput = interaction.options.getString('item');
    
            // Filter the choices based on the user's input
            const filteredChoices = choicesItems.filter(item => item.name.toLowerCase().includes(userInput.toLowerCase()));
    
            // Respond with the filtered choices
            await interaction.respond(filteredChoices.slice(0, 25));
    
        } catch (error) {
            console.error(error);
            await interaction.respond({ content: 'An error occurred while fetching item choices.', ephemeral: true });
        }
    },
    async execute(interaction) {
        // Get the options from the interaction
        const itemName = interaction.options.getString('item');
        const inventoryName = interaction.options.getString('inventory');
        let amount = interaction.options.getInteger('amount');
    
        // Fetch the item from the 'items' collection
        const itemFromDatabase = await getDatabase().collection('items').findOne({ name: itemName });
    
        // Check if the item exists
        if (!itemFromDatabase) {
            return interaction.reply({ content: `Item "${itemName}" not found.`, ephemeral: true });
        }
    
        // Get the itemId from the item in the 'items' collection
        const itemId = itemFromDatabase.id;
    
        // Fetch the user from the database
        const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
    
        // Check if the user exists
        if (!user) {
            return interaction.reply({ content: 'User not found.', ephemeral: true });
        }
    
        // Get the inventory from the user
        const inventory = user[inventoryName];
    
        // Check if the inventory exists
        if (!inventory) {
            return interaction.reply({ content: 'Inventory not found.', ephemeral: true });
        }
    
        // Check if the user has the item in their inventory
        const itemInInventory = inventory.find(item => item.itemId === itemId);
    
        if (!itemInInventory) {
            return interaction.reply({ content: `You don't have ${itemName} in your ${inventoryName}.`, ephemeral: true });
        }
    
        let originalAmount = amount;
        let newInventory = inventory.filter(item => !(item.itemId === itemId && amount-- > 0));
    
        // Update the user's inventory in the database
        await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { [inventoryName]: newInventory } });
    
        // Reply to the interaction
        interaction.reply(`Successfully discarded ${originalAmount} ${itemName} from your ${inventoryName}.`);
    }
};    