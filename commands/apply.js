const Discord = require('discord.js');
const db = require('../db/applications.json')
const { applyContent } = require('../config.json').application
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    perms: [],
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Fill out an application'),
    async execute(interaction) {        
        let applicable = [];

        for(var i in db) {
            const curr = db[i];
            if(curr.enabled && curr.restricted.length < 1) {
                applicable.push(i)
            }
            else if(curr.enabled && curr.restricted.length > 0){
                if(curr.restricted.some(role => interaction.member.roles.cache.some(r => r.id === role))) applicable.push(i);
            }
        }

        const select = 	new Discord.MessageSelectMenu()
            .setCustomId('selectApplication')
            .setPlaceholder('Nothing selected')
            .setMinValues(1)
            .setMaxValues(1)

        applicable.forEach(curr => {
            const application = db[curr]
            select.addOptions([
                {
                    label: `${curr}`,
                    description: `${application.description}`,
                    emoji: `${application.emoji}`,
                    value: `${curr}`
                }
            ])

        })

        const row = new Discord.MessageActionRow()
			.addComponents(select);

        interaction.reply({ content: `${applyContent}`, components: [row], ephemeral: true})

    },
};