const { connect, getDatabase } = require('../database');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'admin-create-job',
    description: 'Create a new job and assign a role (admin only)',
    options: [
        {
            name: 'name',
            type: 3,
            description: 'Name of the job',
            required: true,
        },
        {
            name: 'salary',
            type: 10,
            description: 'Salary per 10 minutes',
            required: true,
        },
        {
            name: 'role',
            type: 8, // Type 8 for ROLE
            description: 'Role to be assigned for this job',
            required: true,
        },
        {
            name: 'emoji',
            type: 3,
            description: 'Emoji for the job',
            required: false,
        },
        {
            name: 'max_amount',
            type: 10,
            description: 'Maximum amount of this job (optional)',
            required: false,
        },
        {
            name: 'clockin_phrase',
            type: 3,
            description: 'Clock-in phrase for this job (optional)',
            required: false,
        },
        {
            name: 'clockout_phrase',
            type: 3,
            description: 'Clock-out phrase for this job (optional)',
            required: false,
        },
    ],
    async execute(interaction) {
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

            const jobName = interaction.options.getString('name');
            const jobSalary = interaction.options.getNumber('salary');
            const roleName = interaction.options.getRole('role');
            const emoji = interaction.options.getString('emoji');
            const maxAmount = interaction.options.getNumber('max_amount') || Infinity;
            const clockinPhrase = interaction.options.getString('clockin_phrase') || '';
            const clockoutPhrase = interaction.options.getString('clockout_phrase') || '';

            // Get the database reference
            const database = getDatabase();

            // Specify the name of your jobs collection
            const jobsCollection = database.collection('jobs');

            // Find the highest current id in the collection
            const highestIdJob = await getDatabase().collection('jobs').findOne({}, { sort: { id: -1 } });

            // Calculate the new id (increment by 1)
            const newId = highestIdJob ? highestIdJob.id + 1 : 1;

            // Create a new job object without using a model
            const newJob = {
                id: newId,
                name: jobName,
                salary: jobSalary,
                role: roleName.id, // Store the role ID in the database
                emoji,
                maxAmount,
                clockinPhrase,
                clockoutPhrase,
            };

            // Insert the new job into the jobs collection
            await jobsCollection.insertOne(newJob);

            // Assign the role to the user
            //await interaction.member.roles.add(roleName);

            // Create an embed to display the information
            const embed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(`Job Created: ${jobName}`)
                .addFields(
                    { name: 'Salary per 10 minutes', value: jobSalary.toString() },
                    { name: 'Role Assigned', value: roleName.name || 'Not Specified'},
                    { name: 'Emoji', value: emoji || 'Not specified' },
                    { name: 'Max Amount', value: maxAmount.toString() },
                    { name: 'Clock-in Phrase', value: clockinPhrase || 'Not specified' },
                    { name: 'Clock-out Phrase', value: clockoutPhrase || 'Not specified' }
                )
                //.setFooter({name: 'Job Created', value: 'Job Created'});

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error creating the job.', ephemeral: true });
        }
    },
};
