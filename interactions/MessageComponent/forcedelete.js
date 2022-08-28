const { EmbedBuilder } = require('discord.js')
const { footer } = require('../../config.json')

module.exports = {
    name: 'forcedelete',
    async execute(interaction, args, logChann) {
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
}