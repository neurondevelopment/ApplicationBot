const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    name: 'editQuestion',
    async execute(interaction, args) {
        const oldEmbed = interaction.message.embeds[0]
        const modal = new ModalBuilder()
            .setCustomId(`editQuestion/\\ND\\/${interaction.values[0]}`)
            .setTitle('Enter Your Response')

        const input = new TextInputBuilder()
            .setCustomId('input')
            .setLabel(oldEmbed.description.split('\n')[(parseInt(interaction.values[0])*2)])
            .setStyle(TextInputStyle.Paragraph)

        const row = new ActionRowBuilder().addComponents(input)
        modal.addComponents(row)

        await interaction.showModal(modal)
    }
}