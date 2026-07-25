import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

const MAX_EMBED_DESCRIPTION_LENGTH = 4096;

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Lists the bot\'s available commands.');

/**
 * @param {{
 *   client: {
 *     commands: Map<string, {
 *       data: { name: string, description: string }
 *     }>
 *   },
 *   followUp: (options: {
 *     embeds: EmbedBuilder[],
 *     flags: number
 *   }) => unknown,
 *   reply: (options: {
 *     content?: string,
 *     embeds?: EmbedBuilder[],
 *     flags: number
 *   }) => unknown
 * }} interaction
 */
export async function execute(interaction) {
	const commands = [...interaction.client.commands.values()]
		.sort((left, right) => left.data.name.localeCompare(right.data.name));

	if (commands.length === 0) {
		await interaction.reply({
			content: 'No commands are currently available.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const descriptions = groupCommandDescriptions(commands);

	await interaction.reply({
		embeds: [createHelpEmbed(descriptions[0])],
		flags: MessageFlags.Ephemeral,
	});

	for (const description of descriptions.slice(1)) {
		await interaction.followUp({
			embeds: [createHelpEmbed(description)],
			flags: MessageFlags.Ephemeral,
		});
	}
}

/**
 * @param {{ data: { name: string, description: string } }[]} commands
 */
function groupCommandDescriptions(commands) {
	/** @type {string[]} */
	const descriptions = [];
	let current = '';

	for (const command of commands) {
		const line = `**/${command.data.name}** — ${command.data.description}`;
		const candidate = current ? `${current}\n${line}` : line;

		if (candidate.length > MAX_EMBED_DESCRIPTION_LENGTH) {
			descriptions.push(current);
			current = line;
		} else {
			current = candidate;
		}
	}

	descriptions.push(current);
	return descriptions;
}

/** @param {string} description */
function createHelpEmbed(description) {
	return new EmbedBuilder()
		.setTitle('Available Commands')
		.setDescription(description);
}
