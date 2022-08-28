const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const { accept, acceptEmoji, deny, denyEmoji, question, questionEmoji } = require('../../config.json').application


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
    name: 'respond',
    async execute(interaction, args) {
        const value = interaction.fields.getTextInputValue('input')
        const channel = await interaction.client.channels.fetch(args[0]).catch(err => {})
        if(!channel) return interaction.reply('An error occured: \`This application has been removed.\`')
        const message = await channel.messages.fetch(args[1]).catch(err => {})
        if(!channel) return interaction.reply('An error occured: \`This application has been removed.\`')
        message.channel.send(`Received response to your question!\nResponse: \`${value}\``)

        button3.setDisabled(false)
        const row2 = new ActionRowBuilder()
            .addComponents(button1,button2,button3)

        interaction.reply({ content: `Successfully responded with:\n\`${value}\``, ephemeral: true})

        message.edit({ components: [row2] })
    }
}