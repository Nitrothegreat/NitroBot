import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('sourcecode')
	.setDescription('Provides a link to the GitHub repository for this bot.');

export async function execute(interaction) {
	await interaction.reply('https://github.com/Nitrothegreat/NitroBot');
}
