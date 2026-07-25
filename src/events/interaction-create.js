import { Events } from 'discord.js';
import { handleInteraction } from '../interactions.js';

export const name = Events.InteractionCreate;

/** @param {import('discord.js').Interaction} interaction */
export async function execute(interaction) {
	await handleInteraction(interaction);
}
