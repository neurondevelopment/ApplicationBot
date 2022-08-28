const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    name: 'deny',
    async execute(interaction, args) {
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
}