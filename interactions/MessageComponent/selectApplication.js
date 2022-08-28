const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SelectMenuBuilder } = require('discord.js')
const db = require('../../db/applications.json')
const { colour, submit, submitEmoji, cancel, cancelEmoji } = require('../../config.json').application
const { footer } = require('../../config.json')

module.exports = {
    name: 'selectApplication',
    async execute(interaction, args) {
        await interaction.deferReply({ ephemeral: true })
        const curr = db[interaction.values[0]]
        if(curr.restricted.length > 0) {
            if(!curr.restricted.some(role => interaction.member.roles.cache.some(r => r.id === role))) return interaction.reply({ content: `You do not have permission to apply for this!`, ephemeral: true})
        }
        if(curr.enabled !== true) return interaction.reply({ content: `This application is currently closed!`, ephemeral: true})
        const embed = new EmbedBuilder()
            .setColor(colour)
            .setAuthor({ name: `${interaction.values[0]}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`**${curr.questions.join('**\nNothing specified\n**')}**\nNothing specified`)
            .setFooter({ text: `${footer} - Made By Cryptonized` })

        const select = new SelectMenuBuilder()
            .setCustomId(`editQuestion`)
            .setPlaceholder('Nothing selected')
            .setMinValues(1)
            .setMaxValues(1)
        curr.questions.forEach(question => {
            select.addOptions([
                {
                    label: `${question.substring(0, 99)}`,
                    value: `${curr.questions.indexOf(question)}`
                }
            ])

        })

        const button1 = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel(`${submit}`)
            .setEmoji(`${submitEmoji}`)
            .setCustomId(`submit`)

        const button2 = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel(`${cancel}`)
            .setEmoji(`${cancelEmoji}`)
            .setCustomId(`cancel`)
        
        const row2 = new ActionRowBuilder()
            .addComponents(button1, button2)
        const row = new ActionRowBuilder()
            .addComponents(select)
        let failed;
        interaction.user.send({ embeds: [embed], components: [row, row2] }).catch(err => {
            failed = true
            interaction.editReply({ content: 'Unable to send you a DM, ensure you have your DMs open!', ephemeral: true})
        })

        if(!failed) interaction.editReply({ content: 'Check your DMs!', ephemeral: true})
    }
}