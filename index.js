const Discord = require('discord.js');
const fs = require('fs')
const undici = require('undici')
const { token, footer } = require('./config.json');
const figlet = require('figlet')
const { Routes, InteractionType, ButtonBuilder, ActionRowBuilder, TextInputBuilder, EmbedBuilder, SelectMenuBuilder, ChannelType, TextInputStyle, ModalBuilder, ButtonStyle } = require('discord.js')
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

const db = require('./db/applications.json')
const { colour, accept, acceptEmoji, deny, denyEmoji, submit, submitEmoji, cancel, cancelEmoji, questionContent, serverID, question, questionEmoji, respond, respondEmoji, loggingChannel } = require('./config.json').application
let logChann

async function checkVersion() {
    const bot = 'ApplicationBot'
    const req = await undici.request(`https://raw.githubusercontent.com/neurondevelopment/${bot}/main/package.json`)
    const data = await req.body.json()
    if(data.version > require('./package.json').version) {
        console.log('\x1b[33m%s\x1b[0m', `New version available, please update to v${data.version} at https://github.com/neurondevelopment/${bot}`)
    }
}

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

const button1 = new ButtonBuilder()
    .setStyle(ButtonStyle.Success)
    .setLabel(`${accept}`)
    .setEmoji(`${acceptEmoji}`)
    .setCustomId(`accept`)

const button2 = new ButtonBuilder()
    .setStyle(ButtonStyle.Danger)
    .setLabel(`${deny}`)
    .setEmoji(`${denyEmoji}`)
    .setCustomId(`deny`)

const button3 = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel(`${question}`)
    .setEmoji(`${questionEmoji}`)
    .setCustomId(`question`)

client.on('interactionCreate', async(interaction) => {
    if(interaction.type === InteractionType.ModalSubmit) {
        if(interaction.customId.startsWith('editQuestion_')) {
            const interactionValue = interaction.customId.split('editQuestion_')[1]
            let value = interaction.fields.getTextInputValue('input')
            const oldEmbed = interaction.message.embeds[0]
            let array = oldEmbed.description.split('\n')
            array[((parseInt(interactionValue)+1)*2)-1] = value
            const newEmbed = EmbedBuilder.from(oldEmbed).setDescription(array.join('\n'))
            interaction.update({ embeds: [newEmbed]})
        }
        else if(interaction.customId === 'deny') {
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {} )
            if(!user) return interaction.message.channel.delete()
            const value = interaction.fields.getTextInputValue('input')

            const info = db[interaction.message.embeds[0].data.fields[2].value]
            const message = info.denyMessage.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].data.fields[2].value).replaceAll('{[REASON]}', value)

            user.send(`${message}`).catch()

            if(logChann) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${user.user.tag} Denied`, iconURL: user.user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`\`${user.user.tag}\` \`(${user.id})\` was denied from \`${interaction.message.embeds[0].data.fields[2].value}\` by \`${interaction.user.tag}\` \`(${interaction.user.id})\`\nReason: \`${value}\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter( { text: `${footer} - Made By Cryptonized` })
                logChann.send({ embeds: [embed] })
            }
            await interaction.reply('Successfully denied the user')

            await interaction.message.channel.delete()
        }
        else if(interaction.customId === 'question') {
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {})
            if(!user) return interaction.message.channel.delete()

            const button1a = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`${respond}`)
                .setEmoji(`${respondEmoji}`)
                .setCustomId(`respond_${interaction.message.channel.id}_${interaction.message.id}`)

            const row = new ActionRowBuilder()
                .addComponents(button1a)

            let value = interaction.fields.getTextInputValue('input');

            const message = questionContent.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].data.fields[2].value).replaceAll('{[QUESTION]}', value)

            let failed
            user.send({ content: `${message}`, components: [row]}).catch(err => {
                failed = true;
            })

            if(failed) return interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})

            button3.setDisabled(true)

            const row2 = new ActionRowBuilder()
                .addComponents(button1,button2,button3)

            interaction.message.edit({ components: [row2] })

            if(logChann) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${user.user.tag} Sent Question`, iconURL: user.user.displayAvatarURL() })
                    .setColor('Orange')
                    .setDescription(`\`${interaction.user.tag}\` \`(${interaction.user.id})\` sent a question \`(${value})\` to \`${user.user.tag}\` \`(${user.user.id})\` for the application of \`${interaction.message.embeds[0].data.fields[2].value}\``)
                    .setThumbnail(user.user.displaydisplayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized` })
                logChann.send({ embeds: [embed] })
            }

            interaction.reply({ content: `Successfully asked question: \`${value}\``, ephemeral: true})
        }
        else if(interaction.customId.startsWith('respond_')) {
            const value = interaction.fields.getTextInputValue('input')
            const channel = await client.channels.fetch(interaction.customId.split('_')[1]).catch(err => {})
            if(!channel) return interaction.reply('An error occured: \`This application has been removed.\`')
            const message = await channel.messages.fetch(interaction.customId.split('_')[2]).catch(err => {})
            if(!channel) return interaction.reply('An error occured: \`This application has been removed.\`')
            message.channel.send(`Received response to your question!\nResponse: \`${value}\``)

            button3.setDisabled(false)
            const row2 = new ActionRowBuilder()
                .addComponents(button1,button2,button3)

            interaction.reply({ content: `Successfully responded with:\n\`${value}\``, ephemeral: true})

            message.edit({ components: [row2] })
        }
    }
    else if(interaction.type === InteractionType.MessageComponent) {
        if(interaction.customId === 'selectApplication') {
            await interaction.deferReply({ ephemeral: true })
            const curr = db[interaction.values[0]]
            if(curr.restricted.length > 0) {
                if(!curr.restricted.some(role => interaction.member.roles.cache.some(r => r.id === role))) return interaction.reply({ content: `You do not have permission to apply for this!`, ephemeral: true})
            }
            if(curr.enabled !== true) return interaction.reply({ content: `This application is currently closed!`, ephemeral: true})
            const embed = new EmbedBuilder()
                .setColor(colour)
                .setAuthor({ name: `${interaction.values[0]}`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`**${curr.questions.join('**\nNothing specified\n**')}**\nNothing specified`)
                .setFooter({ text: `${footer} - Made By Cryptonized` })

            const select = new SelectMenuBuilder()
                .setCustomId(`editQuestion`)
                .setPlaceholder('Nothing selected')
                .setMinValues(1)
                .setMaxValues(1)
            curr.questions.forEach(question => {
                select.addOptions([
                    {
                        label: `${question.substring(0, 99)}`,
                        value: `${curr.questions.indexOf(question)}`
                    }
                ])
    
            })

            const button1 = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel(`${submit}`)
                .setEmoji(`${submitEmoji}`)
                .setCustomId(`submit`)

            const button2 = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(`${cancel}`)
                .setEmoji(`${cancelEmoji}`)
                .setCustomId(`cancel`)
            
            const row2 = new ActionRowBuilder()
                .addComponents(button1, button2)
            const row = new ActionRowBuilder()
                .addComponents(select)
            let failed;
            interaction.user.send({ embeds: [embed], components: [row, row2] }).catch(err => {
                failed = true
                interaction.editReply({ content: 'Unable to send you a DM, ensure you have your DMs open!', ephemeral: true})
            })

            if(!failed) interaction.editReply({ content: 'Check your DMs!', ephemeral: true})
        }
        else if(interaction.customId === 'editQuestion') {
            const oldEmbed = interaction.message.embeds[0]
            const modal = new ModalBuilder()
                .setCustomId(`editQuestion_${interaction.values[0]}`)
                .setTitle('Enter Your Response')

            const input = new TextInputBuilder()
                .setCustomId('input')
                .setLabel(oldEmbed.description.split('\n')[(parseInt(interaction.values[0])*2)])
                .setStyle(TextInputStyle.Paragraph)

            const row = new ActionRowBuilder().addComponents(input)
            modal.addComponents(row)

            await interaction.showModal(modal)
        }
        else if(interaction.customId === 'submit') {
            const category = client.channels.cache.get(db[interaction.message.embeds[0].data.author.name].category)
            if(!category) return interaction.reply({ content: 'This application has been incorrectly configured! Contact the bot owner to fix it!', ephemeral: true})
            const channel = await client.guilds.cache.get(serverID).channels.create({
                name: interaction.user.username,
                type: ChannelType.GuildText,
                parent: category
            })
            const extraEmbed = new EmbedBuilder()
                .setColor(colour)
                .setTitle('Application Information')
                .addFields([
                    { name: `Applicant ID`, value: interaction.user.id },
                    { name: 'Applicant Tag', value: interaction.user.tag },
                    { name: 'Application', value: interaction.message.embeds[0].data.author.name }
                ])
                .setFooter({ text: `${footer} - Made By Cryptonized` })
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()   

            const button1 = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel(`${accept}`)
                .setEmoji(`${acceptEmoji}`)
                .setCustomId(`accept`)

            const button2 = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(`${deny}`)
                .setEmoji(`${denyEmoji}`)
                .setCustomId(`deny`)
            
            const button3 = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`${question}`)
                .setEmoji(`${questionEmoji}`)
                .setCustomId(`question`)
            
            const row = new ActionRowBuilder()
                .addComponents(button1, button2, button3)

            interaction.message.embeds.forEach(curr => {
                channel.send({ embeds: [curr] })
            })
            channel.send({ embeds: [extraEmbed], components: [row]})
            interaction.update({ content: 'Successfully submitted application', embeds: [], components: [] })
        }
        else if(interaction.customId === 'cancel') {
            interaction.update({ content: `Successfully cancelled your application!` })
        }
        else if(interaction.customId === 'accept') {
            const comps = interaction.message.components[0].components
            const info = db[interaction.message.embeds[0].data.fields[2].value]
            let message = info.acceptMessage.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].data.fields[2].value)
            const roles = info.roles
            let failed;
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {})
            if(!user) return interaction.message.channel.delete()
            const guild = await client.guilds.fetch(info.discord).catch(err => {})
            if(guild) {
                const invite = await (guild.channels.cache.filter(c=> c.permissionsFor(guild.members.me).has('CreateInstantInvite') && c.type === ChannelType.GuildText).random()).createInvite({ maxUses: 1, maxAge: 0, unique: true })
                message += `\ndiscord.gg/${invite.code}`
            }
            user.send(`${message}`).catch(err => {
                failed = true;
                const button3 = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🗑️')
                    .setLabel('Force Delete')
                    .setCustomId('forcedelete')
                const newActionRow = new ActionRowBuilder()
                    .addComponents(comps, button3)
                interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
                interaction.message.edit({ components: [newActionRow] })
            })
            if(user && roles.length > 0 && !failed) {
                roles.forEach(curr => {
                    user.roles.add(curr)
                })
            }
            if(logChann && !failed) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${user.user.tag} Accepted`, iconURL: user.user.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`\`${user.user.tag}\` \`(${user.id})\` was accepted into \`${interaction.message.embeds[0].data.fields[2].value}\` by \`${interaction.user.tag}\` \`(${interaction.user.id})\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized` })
                await logChann.send({ embeds: [embed] })
            }

            if(!failed && interaction.message.channel) interaction.message.channel.delete()
        }
        else if(interaction.customId === 'deny') {
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {} )
            if(!user) return interaction.message.channel.delete()

            const modal = new ModalBuilder()
                .setCustomId(interaction.customId)
                .setTitle('Deny Application')

            const input = new TextInputBuilder()
                .setCustomId('input')
                .setLabel('Enter the reason for denying')
                .setStyle(TextInputStyle.Short)

            const row = new ActionRowBuilder().addComponents(input)
            modal.addComponents(row)

            await interaction.showModal(modal)

        }
        else if(interaction.customId === 'forcedelete') {
            if(logChann) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${user.user.tag} Force Deleted`, iconURL: user.user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`Application from \`${user.user.tag}\` \`(${user.id})\` for \`${interaction.message.embeds[0].data.fields[2].value}\` was force deleted by \`${interaction.user.tag}\` \`(${interaction.user.id})\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized`})
                logChann.send({ embeds: [embed] })
            }

            interaction.message.channel.delete()
        }
        else if(interaction.customId === 'question') {
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {})
            if(!user) return interaction.message.channel.delete()

            const modal = new ModalBuilder()
                .setCustomId(interaction.customId)
                .setTitle('Ask A Question')

            const input = new TextInputBuilder()
                .setCustomId('input')
                .setLabel('Enter your question [80 CHARS]')
                .setStyle(TextInputStyle.Short)

            const row = new ActionRowBuilder().addComponents(input)
            modal.addComponents(row)

            await interaction.showModal(modal)

        }
        else if(interaction.customId.startsWith('respond_')) {
            const modal = new ModalBuilder()
                .setCustomId(interaction.customId)
                .setTitle('Respond to Question')

            const input = new TextInputBuilder()
                .setCustomId('input')
                .setLabel('Enter your response.')
                .setStyle(TextInputStyle.Paragraph)

            const row = new ActionRowBuilder().addComponents(input)
            modal.addComponents(row)

            await interaction.showModal(modal)

        }
    }
    else if(interaction.type === InteractionType.ApplicationCommand) {
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
})

client.login(token)
