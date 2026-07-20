import { Events } from 'discord.js';
import { handleInteraction } from '../interactions.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
	await handleInteraction(interaction);
}
