import { Client, GatewayIntentBits } from 'discord.js';

/**
 * Creates a minimally privileged Discord client and registers validated events.
 *
 * @param {object} options
 * @param {import('discord.js').Collection} options.commands
 * @param {Array<object>} options.events
 * @param {Console} [options.logger=console]
 * @returns {Client}
 */
export function createClient({ commands, events, logger = console }) {
	const client = new Client({ intents: [GatewayIntentBits.Guilds] });
	client.commands = commands;
	client.logger = logger;

	for (const event of events) {
		const listener = (...args) => {
			Promise.resolve(event.execute(...args)).catch((error) => {
				logger.error(`Unhandled error in ${event.name} event`, error);
			});
		};

		client[event.once ? 'once' : 'on'](event.name, listener);
	}

	return client;
}
