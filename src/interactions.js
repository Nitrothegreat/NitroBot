import { MessageFlags } from 'discord.js';

const COMMAND_UNAVAILABLE_MESSAGE = 'That command is currently unavailable.';
const COMMAND_ERROR_MESSAGE = 'Something went wrong while running that command.';

/**
 * Routes a chat-input interaction to its command and safely reports failures.
 *
 * @param {import('discord.js').Interaction} interaction
 */
export async function handleInteraction(interaction) {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		interaction.client.logger.error(`No command registered for: ${interaction.commandName}`);
		await safeErrorResponse(interaction, COMMAND_UNAVAILABLE_MESSAGE);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		interaction.client.logger.error(`Command failed: ${interaction.commandName}`, error);
		await safeErrorResponse(interaction, COMMAND_ERROR_MESSAGE);
	}
}

async function safeErrorResponse(interaction, content) {
	try {
		if (interaction.deferred) {
			await interaction.editReply({ content });
		} else if (interaction.replied) {
			await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content, flags: MessageFlags.Ephemeral });
		}
	} catch (error) {
		interaction.client.logger.error(`Failed to send an error response for: ${interaction.commandName}`, error);
	}
}
