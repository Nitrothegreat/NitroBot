import { readdir } from 'node:fs/promises';
import { ApplicationCommandType, Collection } from 'discord.js';
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
		const { command, name } = validateCommandModule(module, file);

		if (commands.has(name)) {
			throw new OperationalError('COMMAND_NAME_DUPLICATE', { file });
		}

		commands.set(name, command);
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
		const event = validateEventModule(module, file);

		if (eventNames.has(event.name)) {
			throw new OperationalError('EVENT_NAME_DUPLICATE', { file });
		}

		eventNames.add(event.name);
		events.push(event);
	}

	return events;
}

/**
 * Validates the command fields consumed by routing, help, and deployment.
 * Serialization must be synchronous, deterministic, and side-effect-free.
 *
 * @param {Record<string, unknown>} module
 * @param {string} file
 * @returns {{ command: Command, name: string }}
 */
function validateCommandModule(module, file) {
	try {
		const { data, execute } = module;

		if (
			typeof data !== 'object'
			|| data === null
		) {
			throw new TypeError();
		}

		const candidate = /** @type {Record<string, unknown>} */ (data);
		const name = candidate.name;
		const description = candidate.description;
		const toJSON = candidate.toJSON;
		if (
			typeof execute !== 'function'
			|| typeof name !== 'string'
			|| name.trim().length === 0
			|| typeof description !== 'string'
			|| description.trim().length === 0
			|| typeof toJSON !== 'function'
		) {
			throw new TypeError();
		}

		const definition = toJSON.call(data);
		if (
			typeof definition !== 'object'
			|| definition === null
			|| Array.isArray(definition)
		) {
			throw new TypeError();
		}

		const serialized = /** @type {Record<string, unknown>} */ (definition);
		const then = serialized.then;
		if (typeof then === 'function') {
			void new Promise((resolve, reject) => {
				then.call(definition, () => resolve(undefined), reject);
			}).catch(() => {});
			throw new TypeError();
		}

		const serializedName = serialized.name;
		const serializedDescription = serialized.description;
		const serializedType = serialized.type;
		if (
			typeof serializedName !== 'string'
			|| serializedName !== name
			|| typeof serializedDescription !== 'string'
			|| serializedDescription !== description
			|| (
				serializedType !== undefined
				&& serializedType !== ApplicationCommandType.ChatInput
			)
		) {
			throw new TypeError();
		}

		return {
			name,
			command: {
				data: /** @type {Command['data']} */ (data),
				execute: /** @type {Command['execute']} */ (execute),
			},
		};
	} catch {
		throw new OperationalError('COMMAND_MODULE_INVALID', { file });
	}
}

/**
 * @param {Record<string, unknown>} module
 * @param {string} file
 * @returns {BotEvent}
 */
function validateEventModule(module, file) {
	try {
		const { name, execute } = module;
		const once = Object.hasOwn(module, 'once') ? module.once : false;

		if (
			typeof name !== 'string'
			|| name.trim().length === 0
			|| typeof once !== 'boolean'
			|| typeof execute !== 'function'
		) {
			throw new TypeError();
		}

		return {
			name,
			once,
			execute: /** @type {BotEvent['execute']} */ (execute),
		};
	} catch {
		throw new OperationalError('EVENT_MODULE_INVALID', { file });
	}
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
