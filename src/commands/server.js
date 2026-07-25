import { MessageFlags, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('server')
	.setDescription('Provides information about the server.');

/**
 * @param {{
 *   guild: { name: string, memberCount: number } | null,
 *   reply: (options: string | { content: string, flags: number }) => unknown
 * }} interaction
 */
export async function execute(interaction) {
	if (!interaction.guild) {
		await interaction.reply({
			content: 'Server information is unavailable outside a server.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
}
