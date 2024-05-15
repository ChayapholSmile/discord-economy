const { Client, GatewayIntentBits } = require('discord.js');

// Your bot token
const token = 'MTIzODQyODg1Njg5MzgzMzIzNg.GD0jaX.YhsUxIjkTZMysE8CM5nppmllWKI3mHjFz0uie0';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Delete all global commands
    const globalCommands = await client.application.commands.fetch();
    if (globalCommands.size > 0) {
        globalCommands.forEach(async (command) => {
            await client.application.commands.delete(command.id);
            console.log(`Deleted global command: ${command.name}`);
        });
    } else {
        console.log('No global commands to delete.');
    }

    // Fetch and delete guild-specific commands
    const guilds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guilds) {
        const guild = client.guilds.cache.get(guildId);
        const guildCommands = await guild.commands.fetch();
        if (guildCommands.size > 0) {
            guildCommands.forEach(async (command) => {
                await guild.commands.delete(command.id);
                console.log(`Deleted command: ${command.name} from guild: ${guild.name}`);
            });
        } else {
            console.log(`No commands to delete in guild: ${guild.name}`);
        }
    }

    console.log('Finished deleting commands.');
    client.destroy();
});

// Login to Discord with your client's token
client.login(token);
