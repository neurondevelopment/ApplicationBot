const Discord = require('discord.js');
const fs = require('fs')
const undici = require('undici')
const { token } = require('./config.json');
const figlet = require('figlet')
const { Routes, InteractionType } = require('discord.js')
const { REST } = require('@discordjs/rest');

const client  = new Discord.Client({
    intents: 14023
});
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());  
    client.commands.set(command.data.name, command);
}

process.on('unhandledRejection', (reason, promise) => {
    const pr = Promise.resolve(promise);
    console.log(`Unhandled Rejection at: ${reason.stack || reason} | ${pr}`);

});

const { loggingChannel } = require('./config.json').application
let logChann

async function checkVersion() {
    const bot = 'ApplicationBot'
    const req = await undici.request(`https://raw.githubusercontent.com/neurondevelopment/${bot}/main/package.json`)
    const data = await req.body.json()
    if(data.version > require('./package.json').version) {
        console.log('\x1b[33m%s\x1b[0m', `New version available, please update to v${data.version} at https://github.com/neurondevelopment/${bot}`)
    }
}

setInterval(() => {
    checkVersion()
}, 300000)

client.on('ready', async () => {
    checkVersion()
    logChann = await client.channels.fetch(loggingChannel).catch(err => { })
    const {serverID } = require('./config.json').application
    const rest = new REST({ version: '10' }).setToken(token);

    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, serverID),
                { body: commands },
            );

            console.log('Successfully registered commands.');
        } catch (error) {
            console.error(error);
        }
    })();
    const { type, content } = require('./config.json').status

    figlet('Neuron Development', function(err, data) {
        if (err) {
            console.log(err)
            return;
        }
        console.log(`\x1b[36m%s\x1b[0m`, data)
        console.log('Started bot')
    });

    if(type && content) {
        if(type.toUpperCase() === 'PLAYING') {
            client.user.setActivity(content, { type: 'PLAYING' })
        }
        else if(type.toUpperCase() === 'WATCHING') {
            client.user.setActivity(content, { type: 'WATCHING' })
        }
        else {
            console.log('Invalid type specified for the bot\'s status')
        }
    }

})

client.on('interactionCreate', async(interaction) => {
    if(interaction.type === InteractionType.ApplicationCommand) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if(command.perms[0] && !command.perms.some(currPerm => interaction.member.permissions.has(currPerm) || interaction.member.roles.cache.some(role => role.id === currPerm))) return interaction.reply({ content: `You do not have permission to run this command!`, ephemeral: true })
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
    else {
        let args = []
        let customId = interaction.customId
        if(interaction.customId.includes('/\\ND\\/')) {
            customId = customId.split('/\\ND\\/')[0]
            args = interaction.customId.split('/\\ND\\/')
            args.shift() // Remove the actual ID
        }
        const interactionFile = require(`./interactions/${InteractionType[interaction.type]}/${customId}`)
        interactionFile.execute(interaction, args, logChann)

    }
})

client.login(token)
