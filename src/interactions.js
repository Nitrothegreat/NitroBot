import { MessageFlags } from 'discord.js';
import { safeErrorDetails } from './errors.js';

const COMMAND_UNAVAILABLE_MESSAGE = 'That command is currently unavailable.';
const COMMAND_ERROR_MESSAGE = 'Something went wrong while running that command.';

/**
 * @typedef {object} InteractionClient
 * @property {Map<string, {
 *   execute: (interaction: import('discord.js').ChatInputCommandInteraction) => unknown
 * }>} commands
 * @property {Pick<Console, 'error'>} logger
 */

/**
 * Routes a chat-input interaction to its command and safely reports failures.
 *
 * @param {import('discord.js').Interaction} interaction
 */
export async function handleInteraction(interaction) {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const client = /** @type {InteractionClient} */ (
		/** @type {unknown} */ (interaction.client)
	);
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		client.logger.error(`No command registered for: ${interaction.commandName}`);
		await safeErrorResponse(interaction, COMMAND_UNAVAILABLE_MESSAGE);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		client.logger.error(
			`Command failed: ${interaction.commandName}`,
			safeErrorDetails(error),
		);
		await safeErrorResponse(interaction, COMMAND_ERROR_MESSAGE);
	}
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} content
 */
async function safeErrorResponse(interaction, content) {
	try {
		if (interaction.replied) {
			await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
		} else if (interaction.deferred) {
			await interaction.editReply({ content });
		} else {
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
	} catch (error) {
		const client = /** @type {InteractionClient} */ (
			/** @type {unknown} */ (interaction.client)
		);
		client.logger.error(
			`Failed to send an error response for: ${interaction.commandName}`,
			safeErrorDetails(error),
		);
	}
}
