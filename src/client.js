import { Client, GatewayIntentBits } from 'discord.js';
import { safeErrorDetails } from './errors.js';

/**
 * @typedef {object} Command
 * @property {{ name: string, toJSON: () => unknown }} data
 * @property {(...args: any[]) => any} execute
 */

/**
 * @typedef {object} BotEvent
 * @property {string} name
 * @property {boolean} once
 * @property {(...args: any[]) => any} execute
 */

/** @typedef {Pick<Console, 'error' | 'info'>} Logger */

/**
 * @typedef {object} ClientAdapter
 * @property {(...args: any[]) => any} on
 * @property {(...args: any[]) => any} once
 */

/**
 * @typedef {Client & {
 *   commands: import('discord.js').Collection<string, Command>,
 *   logger: Logger
 * }} NitroClient
 */

/**
 * Creates a minimally privileged Discord client and registers validated events.
 *
 * @param {object} options
 * @param {import('discord.js').Collection<string, Command>} options.commands
 * @param {BotEvent[]} options.events
 * @param {Logger} [options.logger=console]
 * @param {(options: import('discord.js').ClientOptions) => ClientAdapter} [options.clientFactory]
 * @returns {NitroClient}
 */
export function createClient({
	commands,
	events,
	logger = console,
	clientFactory = (options) => new Client(options),
}) {
	const client = /** @type {NitroClient} */ (
		/** @type {unknown} */ (
			clientFactory({
				allowedMentions: { parse: [] },
				intents: [GatewayIntentBits.Guilds],
			})
		)
	);
	client.commands = commands;
	client.logger = logger;

	for (const event of events) {
		/** @param {...any} args */
		const listener = (...args) => {
			Promise.resolve().then(() => event.execute(...args)).catch((error) => {
				logger.error(
					`Unhandled error in ${event.name} event`,
					safeErrorDetails(error),
				);
			});
		};

		client[event.once ? 'once' : 'on'](event.name, listener);
	}

	return client;
}
