import { readdir } from 'node:fs/promises';
import { Collection } from 'discord.js';

/**
 * Loads and validates command modules from a directory.
 *
 * @param {URL} directory Directory containing command modules.
 * @returns {Promise<Collection<string, { data: object, execute: Function }>>}
 */
export async function loadCommands(directory) {
	const modules = await importJavaScriptModules(directory);
	const commands = new Collection();

	for (const { file, module } of modules) {
		const { data, execute } = module;
		const name = data?.name;

		if (typeof name !== 'string' || typeof data?.toJSON !== 'function' || typeof execute !== 'function') {
			throw new Error(`Invalid command module: ${file}`);
		}

		if (commands.has(name)) {
			throw new Error(`Duplicate command name: ${name}`);
		}

		commands.set(name, { data, execute });
	}

	return commands;
}

/**
 * Loads and validates event modules from a directory.
 *
 * @param {URL} directory Directory containing event modules.
 * @returns {Promise<Array<{ name: string, once: boolean, execute: Function }>>}
 */
export async function loadEvents(directory) {
	const modules = await importJavaScriptModules(directory);
	const events = [];
	const eventNames = new Set();

	for (const { file, module } of modules) {
		const { name, once = false, execute } = module;

		if (typeof name !== 'string' || typeof once !== 'boolean' || typeof execute !== 'function') {
			throw new Error(`Invalid event module: ${file}`);
		}

		if (eventNames.has(name)) {
			throw new Error(`Duplicate event name: ${name}`);
		}

		eventNames.add(name);
		events.push({ name, once, execute });
	}

	return events;
}

async function importJavaScriptModules(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
		.map((entry) => entry.name)
		.sort();

	return Promise.all(files.map(async (file) => ({
		file,
		module: await import(new URL(file, directory)),
	})));
}
