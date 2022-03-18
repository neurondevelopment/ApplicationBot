const Discord = require('discord.js');
const fs = require('fs')
const { token, footer } = require('./config.json');
const figlet = require('figlet')
const client  = new Discord.Client({
    partials: ['CHANNEL', 'MESSAGE', "REACTION", 'GUILD_MEMBER'],
    intents: 14023
});
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());  
    client.commands.set(command.data.name, command);
}

const db = require('./db/applications.json')
const { colour, accept, acceptEmoji, deny, denyEmoji, submit, submitEmoji, cancel, cancelEmoji, questionContent, serverID, question, questionEmoji, respond, respondEmoji, loggingChannel } = require('./config.json').application
let logChann

client.on('ready', async () => {
    logChann = await client.channels.fetch(loggingChannel).catch(err => { })
    const {serverID } = require('./config.json').application
    const rest = new REST({ version: '9' }).setToken(token);

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
    const filter = m => m.author.id === interaction.user.id
    if(interaction.isSelectMenu()) {
        if(interaction.customId === 'selectApplication') {
            await interaction.deferReply({ ephemeral: true })
            const curr = db[interaction.values[0]]
            if(curr.restricted.length > 0) {
                if(!curr.restricted.some(role => interaction.member.roles.cache.some(r => r.id === role))) return interaction.reply({ content: `You do not have permission to apply for this!`, ephemeral: true})
            }
            if(curr.enabled !== true) return interaction.reply({ content: `This application is currently closed!`, ephemeral: true})
            const embed = new Discord.MessageEmbed()
                .setColor(colour)
                .setAuthor({ text: `${interaction.values[0]}`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`**${curr.questions.join('**\nNothing specified\n**')}**\nNothing specified`)
                .setFooter({ text: `${footer} - Made By Cryptonized` })

            const select = new Discord.MessageSelectMenu()
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

            const button1 = new Discord.MessageButton()
                .setStyle('SUCCESS')
                .setLabel(`${submit}`)
                .setEmoji(`${submitEmoji}`)
                .setCustomId(`submit`)

            const button2 = new Discord.MessageButton()
                .setStyle('DANGER')
                .setLabel(`${cancel}`)
                .setEmoji(`${cancelEmoji}`)
                .setCustomId(`cancel`)
            
            const row2 = new Discord.MessageActionRow()
                .addComponents(button1, button2)
            const row = new Discord.MessageActionRow()
                .addComponents(select)
            interaction.user.send({ embeds: [embed], components: [row, row2] }).catch(err => {
                interaction.reply({ content: 'Unable to send you a DM, ensure you have your DMs open!', ephemeral: true})
            })

            interaction.editReply({ content: 'Check your DMs!', ephemeral: true})
        }
        else if(interaction.customId === 'editQuestion') {
            await interaction.deferReply({ ephemeral: true })
            const oldEmbed = interaction.message.embeds[0]
            let value;
            await interaction.followUp({ content: `Enter your response to: ${oldEmbed.description.split('\n')[(parseInt(interaction.values[0])*2)]}`, ephemeral: true}) 
            let array = oldEmbed.description.split('\n')
            const msg = await interaction.message.channel.awaitMessages({filter, max: 1, time: 600000 })
            if(!msg) return interaction.followUp({ content: 'Timed out after 10 minutes', ephemeral: true })
            if((oldEmbed.description.length + msg.first().content.length - array[((parseInt(interaction.values[0])+1)*2)-1].length) > 4096) {
                return interaction.followUp({ content: 'You have gone over the 4096 character limit!', ephemeral: true })
            }
            else {
                value = msg.first().content
            }

            array[((parseInt(interaction.values[0])+1)*2)-1] = value
            const newEmbed = oldEmbed.setDescription(array.join('\n'))
            interaction.message.edit({ embeds: [newEmbed]})
        }
    }
    else if(interaction.isCommand()) {
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
    else if(interaction.isButton()) {
        if(interaction.customId === 'submit') {
            const category = client.channels.cache.get(db[interaction.message.embeds[0].author.name].category)
            if(!category) return interaction.reply({ content: 'This application has been incorrectly configured! Contact the bot owner to fix it!', ephemeral: true})
            const channel = await client.guilds.cache.get(serverID).channels.create(`${interaction.user.username}`, {
                type: 'GUILD_TEXT',
                parent: category
            })
            const extraEmbed = new Discord.MessageEmbed()
                .setColor(colour)
                .setTitle('Application Information')
                .addField(`Applicant ID`, interaction.user.id)
                .addField('Applicant Tag', interaction.user.tag)
                .addField('Application', interaction.message.embeds[0].author.name)
                .setFooter({ text: `${footer} - Made By Cryptonized` })
                .setImage(interaction.user.displayAvatarURL())
                .setTimestamp()   

            const button1 = new Discord.MessageButton()
                .setStyle('SUCCESS')
                .setLabel(`${accept}`)
                .setEmoji(`${acceptEmoji}`)
                .setCustomId(`accept`)

            const button2 = new Discord.MessageButton()
                .setStyle('DANGER')
                .setLabel(`${deny}`)
                .setEmoji(`${denyEmoji}`)
                .setCustomId(`deny`)
            
            const button3 = new Discord.MessageButton()
                .setStyle('SECONDARY')
                .setLabel(`${question}`)
                .setEmoji(`${questionEmoji}`)
                .setCustomId(`question`)
            
            const row = new Discord.MessageActionRow()
                .addComponents(button1, button2, button3)

            interaction.message.embeds.forEach(curr => {
                channel.send({ embeds: [curr] })
            })
            channel.send({ embeds: [extraEmbed], components: [row]})
            interaction.reply({ content: `Successfully submitted application!`, ephemeral: true })
            interaction.message.delete()
        }
        else if(interaction.customId === 'cancel') {
            interaction.message.delete()
            interaction.reply({ content: `Successfully cancelled your application!`, ephemeral: true })
        }
        else if(interaction.customId === 'accept') {
            const comps = interaction.message.components[0].components
            const info = db[interaction.message.embeds[0].fields[2].value]
            const message = info.acceptMessage.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].fields[2].value)
            const roles = info.roles
            let failed;
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].fields[0].value).catch(err => {
                failed = true;
                return interaction.reply({ content: `Cannot accept this application as this user is no longer in the server!`, ephemeral: true})
            })
            if(failed) return;
            if(!user){
                interaction.reply({ content: `Cannot accept this application as this user is no longer in the server!`, ephemeral: true})
            }   
            else if(user && roles.length > 0) {
                roles.forEach(curr => {
                    user.roles.add(curr)
                })
                let failed;
                const guild = client.guilds.cache.get(info.discord)
                if(!guild) {
                    user.send(`${message}`).catch(err => {
                            failed = true;
                            const button3 = new Discord.MessageButton()
                                .setStyle('SECONDARY')
                                .setEmoji('🗑️')
                                .setLabel('Force Delete')
                                .setCustomId('forcedelete')
                            const newActionRow = new Discord.MessageActionRow()
                                .addComponents(comps[0], comps[1], button3)
                            interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
                            interaction.message.edit({ components: [newActionRow] })
                        })
                }
                else {
                    guild.channels.cache.filter(c=> c.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE') && c.type === 'GUILD_TEXT').random().createInvite({ maxUses: 1, maxAge: 0, unique: true }).then(invite => {
                        user.send(`${message}\ndiscord.gg/${invite.code}`).catch(err => {
                            failed = true;
                            const button3 = new Discord.MessageButton()
                                .setStyle('SECONDARY')
                                .setEmoji('🗑️')
                                .setLabel('Force Delete')
                                .setCustomId('forcedelete')
                            const newActionRow = new Discord.MessageActionRow()
                                .addComponents(comps[0], comps[1], button3)
                            interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
                            interaction.message.edit({ components: [newActionRow] })
                        })
                    })
                }
                if(!failed && interaction.message.channel) interaction.message.channel.delete()
            }
            else {
                let failed;
                const guild = client.guilds.cache.get(info.discord)
                if(!guild) {
                    user.send(`${message}`).catch(err => {
                            failed = true;
                            const button3 = new Discord.MessageButton()
                                .setStyle('SECONDARY')
                                .setEmoji('🗑️')
                                .setLabel('Force Delete')
                                .setCustomId('forcedelete')
                            const newActionRow = new Discord.MessageActionRow()
                                .addComponents(comps[0], comps[1], button3)
                            interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
                            interaction.message.edit({ components: [newActionRow] })
                        })
                }
                else {
                    guild.channels.cache.filter(c=> c.permissionsFor(guild.me).has('CREATE_INSTANT_INVITE') && c.type === 'GUILD_TEXT').random().createInvite({ maxUses: 1, maxAge: 0, unique: true }).then(invite => {
                        user.send(`${message}\ndiscord.gg/${invite.code}`).catch(err => {
                            failed = true;
                            const button3 = new Discord.MessageButton()
                                .setStyle('SECONDARY')
                                .setEmoji('🗑️')
                                .setLabel('Force Delete')
                                .setCustomId('forcedelete')
                            const newActionRow = new Discord.MessageActionRow()
                                .addComponents(comps[0], comps[1], button3)
                            interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
                            interaction.message.edit({ components: [newActionRow] })
                        })
                    })
                }
                if(!failed && interaction.message.channel) interaction.message.channel.delete()
            }   
        
            if(logChann) {
                const embed = new Discord.MessageEmbed()
                    .setAuthor({ text: `${user.user.tag} Accepted`, iconURL: user.user.displayAvatarURL() })
                    .setColor('GREEN')
                    .setDescription(`\`${user.user.tag}\` \`(${user.id})\` was accepted into \`${interaction.message.embeds[0].fields[2].value}\` by \`${interaction.user.tag}\` \`(${interaction.user.id})\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized` })
                logChann.send({ embeds: [embed] })
            }
        
        }
        else if(interaction.customId === 'deny') {
            await interaction.deferReply({ ephemeral: true })
            let failed;
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].fields[0].value).catch(err => {
                failed = true;
            })
            if(failed) return interaction.message.channel.delete();
            if(!user){
                return interaction.message.channel.delete()
            } 
            let value;
            const a = await interaction.editReply({ content: 'Enter the reason for denying', ephemeral: true })
            await interaction.message.channel.awaitMessages({filter, max: 1, time: 600000 })
            .then(async msg => {
                if(!msg) return interaction.followUp({ content: 'Timed out after 10 minutes', ephemeral: true })
                value = msg.first().content
            })

            const info = db[interaction.message.embeds[0].fields[2].value]
            const message = info.denyMessage.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].fields[2].value).replaceAll('{[REASON]}', value)

            user.send(`${message}`).catch()

            if(logChann) {
                const embed = new Discord.MessageEmbed()
                    .setAuthor({ text: `${user.user.tag} Denied`, iconURL: user.user.displayAvatarURL() })
                    .setColor('RED')
                    .setDescription(`\`${user.user.tag}\` \`(${user.id})\` was denied from \`${interaction.message.embeds[0].fields[2].value}\` by \`${interaction.user.tag}\` \`(${interaction.user.id})\`\nReason: \`${value}\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter( { text: `${footer} - Made By Cryptonized` })
                logChann.send({ embeds: [embed] })
            }

            await interaction.message.channel.delete()
            

        }
        else if(interaction.customId === 'forcedelete') {
            if(logChann) {
                const embed = new Discord.MessageEmbed()
                    .setAuthor({ text: `${user.user.tag} Force Deleted`, iconURL: user.user.displayAvatarURL() })
                    .setColor('RED')
                    .setDescription(`Application from \`${user.user.tag}\` \`(${user.id})\` for \`${interaction.message.embeds[0].fields[2].value}\` was force deleted by \`${interaction.user.tag}\` \`(${interaction.user.id})\``)
                    .setThumbnail(user.user.displayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized`})
                logChann.send({ embeds: [embed] })
            }

            interaction.message.channel.delete()
        }
        else if(interaction.customId === 'question') {
            await interaction.deferReply({ ephemeral: true })

            let failed;
            const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].fields[0].value).catch(err => {
                failed = true;
                return interaction.editReply({ content: `Cannot do this application as this user is no longer in the server!`, ephemeral: true})
            })
            if(failed) return;
            if(!user){
                return interaction.editReply({ content: `Cannot accept this application as this user is no longer in the server!`, ephemeral: true})
            } 

            const button1a = new Discord.MessageButton()
                .setStyle('SECONDARY')
                .setLabel(`${respond}`)
                .setEmoji(`${respondEmoji}`)
                .setCustomId(`respond_${interaction.message.channel.id}_${interaction.message.id}`)

            const row = new Discord.MessageActionRow()
                .addComponents(button1a)

            let value;
            await interaction.followUp({ content: 'Enter your question', ephemeral: true })
            await interaction.message.channel.awaitMessages({filter, max: 1, time: 600000 })
            .then(async msg => {
                if(!msg) return interaction.message.channel.send('Timed out after 10 minutes')
                value = msg.first().content
                msg.first().delete()
            })

            const message = questionContent.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].fields[2].value).replaceAll('{[QUESTION]}', value)

            user.send({ content: `${message}`, components: [row]}).catch(err => {
                failed = true;
                interaction.followUp({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
            })

            if(failed) return;

            const button1 = new Discord.MessageButton()
                .setStyle('SUCCESS')
                .setLabel(`${accept}`)
                .setEmoji(`${acceptEmoji}`)
                .setCustomId(`accept`)

            const button2 = new Discord.MessageButton()
                .setStyle('DANGER')
                .setLabel(`${deny}`)
                .setEmoji(`${denyEmoji}`)
                .setCustomId(`deny`)
            
            const button3 = new Discord.MessageButton()
                .setStyle('SECONDARY')
                .setLabel(`${question}`)
                .setEmoji(`${questionEmoji}`)
                .setDisabled(true)
                .setCustomId(`question`)

            const row2 = new Discord.MessageActionRow()
                .addComponents(button1,button2,button3)

            interaction.message.edit({ components: [row2] })

            if(logChann) {
                const embed = new Discord.MessageEmbed()
                    .setAuthor({ text: `${user.user.tag} Sent Question`, iconURL: user.user.displayAvatarURL() })
                    .setColor('ORANGE')
                    .setDescription(`\`${interaction.user.tag}\` \`(${interaction.user.id})\` sent a question \`(${value})\` to \`${user.user.tag}\` \`(${user.user.id})\` for the application of \`${interaction.message.embeds[0].fields[2].value}\``)
                    .setThumbnail(user.user.displaydisplayAvatarURL())
                    .setTimestamp()
                    .setFooter({ text: `${footer} - Made By Cryptonized` })
                logChann.send({ embeds: [embed] })
            }

            interaction.editReply({ content: `Successfully asked question: \`${value}\``, ephemeral: true})

        }
        else if(interaction.customId.startsWith('respond_')) {
            await interaction.deferReply({ ephemeral: true })
            const channel = interaction.customId.split('_')[1]
            const message = await client.channels.cache.get(channel).messages.fetch(interaction.customId.split('_')[2])

            const a = await interaction.editReply({ content: 'Enter your response', ephemeral: true })
            await interaction.message.channel.awaitMessages({filter, max: 1, time: 600000 })
            .then(async msg => {
                if(!msg) return interaction.followUp({ content: 'Timed out after 10 minutes', ephemeral: true })
                value = msg.first().content
            })

            message.channel.send(`Received response to your question!\nResponse: \`${value}\``)

            const button1 = new Discord.MessageButton()
                .setStyle('SUCCESS')
                .setLabel(`${accept}`)
                .setEmoji(`${acceptEmoji}`)
                .setCustomId(`accept`)

            const button2 = new Discord.MessageButton()
                .setStyle('DANGER')
                .setLabel(`${deny}`)
                .setEmoji(`${denyEmoji}`)
                .setCustomId(`deny`)
            
            const button3 = new Discord.MessageButton()
                .setStyle('SECONDARY')
                .setLabel(`${question}`)
                .setEmoji(`${questionEmoji}`)
                .setDisabled(false)
                .setCustomId(`question`)

            const row2 = new Discord.MessageActionRow()
                .addComponents(button1,button2,button3)

            interaction.editReply({ content: `Successfully responded!`, ephemeral: true})

            message.edit({ components: [row2] })

        }
    }
})

client.login(token)
