module.exports = {
    name: 'cancel',
    async execute(interaction, args) {
        interaction.update({ content: `Successfully cancelled your application!` })        
    }
}