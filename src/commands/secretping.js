import { MessageFlags, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('secretping')
	.setDescription('Replies with Pong privately!');

export async function execute(interaction) {
	await interaction.reply({ content: 'Pong!', flags: MessageFlags.Ephemeral });
}
