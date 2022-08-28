const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    name: 'respond',
    async execute(interaction, args) {
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