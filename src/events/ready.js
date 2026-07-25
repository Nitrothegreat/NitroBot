import { Events } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

/**
 * @param {{
 *   logger: Pick<Console, 'info'>,
 *   user: { tag: string } | null
 * }} client
 */
export function execute(client) {
	client.logger.info(`Ready! Logged in as ${client.user?.tag ?? 'unknown user'}`);
}
