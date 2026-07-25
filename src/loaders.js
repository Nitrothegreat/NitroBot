import { readdir } from 'node:fs/promises';
import { Collection } from 'discord.js';
import { OperationalError } from './errors.js';

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

/**
 * Loads and validates command modules from a directory.
 *
 * @param {URL} directory Directory containing command modules.
 * @returns {Promise<Collection<string, Command>>}
 */
export async function loadCommands(directory) {
	const modules = await importJavaScriptModules(directory);
	const commands = new Collection();

	for (const { file, module } of modules) {
		const { data, execute } = module;
		const name = data?.name;

		if (typeof name !== 'string' || typeof data?.toJSON !== 'function' || typeof execute !== 'function') {
			throw new OperationalError('COMMAND_MODULE_INVALID', { file });
		}

		if (commands.has(name)) {
			throw new OperationalError('COMMAND_NAME_DUPLICATE', { file });
		}

		commands.set(name, { data, execute });
	}

	return commands;
}

/**
 * Loads and validates event modules from a directory.
 *
 * @param {URL} directory Directory containing event modules.
 * @returns {Promise<BotEvent[]>}
 */
export async function loadEvents(directory) {
	const modules = await importJavaScriptModules(directory);
	const events = [];
	const eventNames = new Set();

	for (const { file, module } of modules) {
		const { name, once = false, execute } = module;

		if (typeof name !== 'string' || typeof once !== 'boolean' || typeof execute !== 'function') {
			throw new OperationalError('EVENT_MODULE_INVALID', { file });
		}

		if (eventNames.has(name)) {
			throw new OperationalError('EVENT_NAME_DUPLICATE', { file });
		}

		eventNames.add(name);
		events.push({ name, once, execute });
	}

	return events;
}

/**
 * @param {URL} directory
 */
async function importJavaScriptModules(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
		.map((entry) => entry.name)
		.sort();

	return Promise.all(files.map(async (file) => ({
		file,
		module: await import(new URL(file, directory).href),
	})));
}
