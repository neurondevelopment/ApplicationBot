const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require('discord.js')
const db = require('../../db/applications.json')
const { footer } = require('../../config.json')

module.exports = {
    name: 'accept',
    async execute(interaction, args, logChann) {
        const comps = interaction.message.components[0].components
        const info = db[interaction.message.embeds[0].data.fields[2].value]
        let message = info.acceptMessage.replaceAll('{[APPLICATION]}', interaction.message.embeds[0].data.fields[2].value)
        const roles = info.roles
        let failed;
        const user = await interaction.message.guild.members.fetch(interaction.message.embeds[0].data.fields[0].value).catch(err => {})
        if(!user) return interaction.message.channel.delete()
        const guild = await interaction.client.guilds.fetch(info.discord).catch(err => {})
        if(guild) {
            const invite = await (guild.channels.cache.filter(c=> c.permissionsFor(guild.members.me).has('CreateInstantInvite') && c.type === ChannelType.GuildText).random()).createInvite({ maxUses: 1, maxAge: 0, unique: true })
            message += `\ndiscord.gg/${invite.code}`
        }
        user.send(`${message}`).catch(err => {
            failed = true;
            const button3 = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🗑️')
                .setLabel('Force Delete')
                .setCustomId('forcedelete')
            const newActionRow = new ActionRowBuilder()
                .addComponents(comps, button3)
            interaction.reply({ content: `Error sending a message to this user, their DMs are most likely off`, ephemeral: true})
            interaction.message.edit({ components: [newActionRow] })
        })
        if(user && roles.length > 0 && !failed) {
            roles.forEach(curr => {
                user.roles.add(curr)
            })
        }
        if(logChann && !failed) {
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${user.user.tag} Accepted`, iconURL: user.user.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`\`${user.user.tag}\` \`(${user.id})\` was accepted into \`${interaction.message.embeds[0].data.fields[2].value}\` by \`${interaction.user.tag}\` \`(${interaction.user.id})\``)
                .setThumbnail(user.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `${footer} - Made By Cryptonized` })
            await logChann.send({ embeds: [embed] })
        }

        if(!failed && interaction.message.channel) interaction.message.channel.delete()
    }
}