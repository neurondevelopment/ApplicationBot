const { EmbedBuilder } = require('discord.js')
const db = require('../../db/applications.json')
const { footer } = require('../../config.json')

module.exports = {
    name: 'deny',
    async execute(interaction, args, logChann) {
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
}