const { EmbedBuilder } = require('discord.js')

module.exports = {
    name: 'editQuestion',
    async execute(interaction, args) {
        const interactionValue = args[0]
        let value = interaction.fields.getTextInputValue('input')
        const oldEmbed = interaction.message.embeds[0]
        let array = oldEmbed.description.split('\n')
        array[((parseInt(interactionValue)+1)*2)-1] = value
        const newEmbed = EmbedBuilder.from(oldEmbed).setDescription(array.join('\n'))
        interaction.update({ embeds: [newEmbed]})
    }
}