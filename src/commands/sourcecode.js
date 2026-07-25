import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('sourcecode')
	.setDescription('Provides a link to the GitHub repository for this bot.');

/** @param {{ reply: (options: string) => unknown }} interaction */
export async function execute(interaction) {
	await interaction.reply('https://github.com/Nitrothegreat/NitroBot');
}
