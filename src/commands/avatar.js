import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('avatar')
	.setDescription('Displays a user\'s avatar.')
	.addUserOption((option) => option
		.setName('target')
		.setDescription('The user whose avatar to display.')
		.setRequired(false));

/**
 * @param {{
 *   options: {
 *     getUser: (name: string) => {
 *       displayAvatarURL: (options: {
 *         extension: 'png',
 *         forceStatic: boolean,
 *         size: 1024
 *       }) => string,
 *       username: string
 *     } | null
 *   },
 *   reply: (options: { embeds: EmbedBuilder[] }) => unknown,
 *   user: {
 *     displayAvatarURL: (options: {
 *       extension: 'png',
 *       forceStatic: boolean,
 *       size: 1024
 *     }) => string,
 *     username: string
 *   }
 * }} interaction
 */
export async function execute(interaction) {
	const selectedUser = interaction.options.getUser('target') ?? interaction.user;
	const avatarUrl = selectedUser.displayAvatarURL({
		extension: 'png',
		forceStatic: true,
		size: 1024,
	});
	const embed = new EmbedBuilder()
		.setTitle(`${selectedUser.username}'s Avatar`)
		.setImage(avatarUrl);

	await interaction.reply({ embeds: [embed] });
}
