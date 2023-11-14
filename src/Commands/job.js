const { getDatabase } = require('../database');

const JOB_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

module.exports = {
    name: 'job',
    description: 'Start working in your chosen profession',
    async execute(interaction) {
        try {
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });
            
            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Fetch available jobs from the database
            const jobs = await getDatabase().collection('jobs').find().toArray();

            const jobNames = jobs.map(job => job.name);

            // Prompt user to choose a job
            await interaction.reply({ content: 'Choose a job:', ephemeral: true, components: [{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: 'job_selection',
                    options: jobNames.map(job => ({ label: job, value: job })),
                    placeholder: 'Select a job',
                }],
            }]});

            const jobSelection = await interaction.channel.awaitMessageComponent({
                filter: i => i.customId === 'job_selection' && i.user.id === interaction.user.id,
                time: 30000, // 30 seconds timeout
            });

            if (!jobSelection) {
                return interaction.followUp('Job selection timed out.');
            }

            const selectedJobName = jobSelection.values[0];
            const selectedJob = jobs.find(job => job.name === selectedJobName);

            // Check if the user has all the required items for the job
            const missingItems = selectedJob.items.filter(item => !user.inventory.some(userItem => userItem.name === item.name));
            //console.log(missingItems);

            if (missingItems.length > 0) {
                const missingItemsNames = missingItems.map(item => item.name).join(', ');
                return interaction.followUp(`You are missing the following items to start the job: ${missingItemsNames}.`);
            }

            // Check if the user is already working on a job
            if (user.currentJob) {
                return interaction.followUp('You are already working on a job. Complete your current job before starting a new one.');
            }

            // Assign the job to the user
            const jobInfo = {
                name: selectedJob.name,
                startTime: new Date(),  // Timestamp when the job was started
                totalEarned: 0,
                salary: selectedJob.salary, // Make sure to include the salary information
            };

            // Update the user's current job field
            user.currentJob = jobInfo;

            // Update the user in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { currentJob: user.currentJob } });

            interaction.followUp(`💼 You have started working as a ${selectedJob.name}.`);
        } catch (error) {
            console.error(error);
            interaction.followUp({ content: `An error occurred while processing your job assignment. ${error.message}`, ephemeral: true });
        }
    },
};
