const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js')
const db = require('../../db/applications.json')
const { colour, accept, acceptEmoji, deny, denyEmoji, serverID, question, questionEmoji } = require('../../config.json').application
const { footer } = require('../../config.json')

module.exports = {
    name: 'submit',
    async execute(interaction, args) {
        const category = await interaction.client.channels.fetch(db[interaction.message.embeds[0].data.author.name].category)
        if(!category) return interaction.reply({ content: 'This application has been incorrectly configured! Contact the bot owner to fix it!', ephemeral: true})
        const guild = await interaction.client.guilds.fetch(serverID)
        const channel = await guild.channels.create({
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
}