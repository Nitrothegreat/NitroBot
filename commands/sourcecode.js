const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sourcecode')
		.setDescription('Provides link to GitHub repo for this bot'),
	async execute(interaction) {
		await interaction.reply('https://github.com/Nitrothegreat/NitroBot');
	},
};
