const { getDatabase } = require('../database');

module.exports = {
    name: 'job-cashout',
    description: 'Cash out your earnings from your current job',
    async execute(interaction) {
        try {
            const user = await getDatabase().collection('users').findOne({ _id: interaction.user.id });

            if (!user) {
                return interaction.reply({ content: 'User not found.', ephemeral: true });
            }

            // Check if the user is currently working on a job
            if (!user.currentJob) {
                return interaction.reply('You are not currently working on a job. Use /job to start one.');
            }

            const { startTime, salary, clockoutPhrase, emoji } = user.currentJob;
            
            // Calculate the elapsed time in minutes
            const elapsedTimeMinutes = Math.floor((new Date() - new Date(startTime)) / (1000 * 60));

            // Get the maxAmount of earnings
            const maxAmount = user.currentJob.maxAmount || Infinity;

            console.log('elapsedTimeMinutes:', elapsedTimeMinutes);
            console.log('salary:', salary);
            console.log('max Amount:', maxAmount);

            // Calculate the maximum possible earnings based on elapsed time
            const maxEarnings = Math.min(Math.floor(elapsedTimeMinutes / 10) * salary, maxAmount);

            console.log('maxEarnings:', maxEarnings);

            // Award the earnings to the user's cash
            user.cash += maxEarnings;

            // Reset the user's current job
            user.currentJob = null;

            // Update the user in the database
            await getDatabase().collection('users').updateOne({ _id: interaction.user.id }, { $set: { cash: user.cash, currentJob: user.currentJob } });

            interaction.reply({content: `${emoji} You have successfully cashed out ${maxEarnings.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} from your job earnings. ${clockoutPhrase}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'An error occurred while processing your job cashout.', ephemeral: true });
        }
    },
};