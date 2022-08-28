const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { accept, acceptEmoji, deny, denyEmoji, questionContent, question, questionEmoji, respond, respondEmoji } = require('../../config.json').application
const { footer } = require('../../config.json')

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

module.exports = {
    name: 'question',
    async execute(interaction, args, logChann) {
        const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {})
        if(!user) return interaction.message.channel.delete()

        const button1a = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(`${respond}`)
            .setEmoji(`${respondEmoji}`)
            .setCustomId(`respond/\\ND\\/${interaction.message.channel.id}/\\ND\\/${interaction.message.id}`)

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
}