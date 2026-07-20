import { MessageFlags, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('user')
	.setDescription('Provides information about the user.');

export async function execute(interaction) {
	const joinedAt = interaction.member?.joinedAt;

	if (!joinedAt) {
		await interaction.reply({
			content: `This command was run by ${interaction.user.username}; their server join date is unavailable.`,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.reply(`This command was run by ${interaction.user.username}, who joined on ${joinedAt}.`);
}
