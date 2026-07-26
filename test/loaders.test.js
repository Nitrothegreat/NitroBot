import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, it } from 'node:test';
import { safeErrorDetails } from '../src/errors.js';
import { loadCommands, loadEvents } from '../src/loaders.js';

/** @type {string[]} */
const temporaryDirectories = [];

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

/** @param {Record<string, string>} files */
async function fixtureDirectory(files) {
	const directory = await mkdtemp(join(tmpdir(), 'nitrobot-test-'));
	temporaryDirectories.push(directory);

	await Promise.all(Object.entries(files).map(([name, contents]) => (
		writeFile(join(directory, name), contents)
	)));

	return pathToFileURL(`${directory}/`);
}

describe('loadCommands', () => {
	it('loads valid JavaScript command modules in filename order', async () => {
		const directory = await fixtureDirectory({
			'b.js': "export const data = { name: 'b', description: 'B', toJSON() { return { name: this.name, description: this.description }; } }; export function execute() {}",
			'a.js': "export const data = { name: 'a', description: 'A', toJSON() { return { name: this.name, description: this.description, type: 1 }; } }; export async function execute() {}",
			'ignored.txt': 'not JavaScript',
		});

		const commands = await loadCommands(directory);
		assert.deepEqual([...commands.keys()], ['a', 'b']);
	});

	it('loads every production command module', async () => {
		const commands = await loadCommands(new URL('../src/commands/', import.meta.url));
		assert.deepEqual(
			[...commands.keys()],
			['avatar', 'botinfo', 'help', 'ping', 'poll', 'roll', 'secretping', 'server', 'sourcecode', 'user'],
		);
	});

	it('rejects malformed command module contracts', async () => {
		const invalidModules = [
			'export const data = null; export function execute() {}',
			"export const data = { name: '', description: 'Valid', toJSON() { return {}; } }; export function execute() {}",
			"export const data = { name: 'valid', description: ' ', toJSON() { return {}; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid' }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return { name: this.name, description: this.description }; } };",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { throw new Error('SERIALIZER_SECRET'); } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return null; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return []; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return Promise.resolve({ name: this.name, description: this.description }); } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return { name: 'different', description: this.description }; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return { name: this.name, description: 'Different' }; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { return { name: this.name, description: this.description, type: 2 }; } }; export function execute() {}",
			"export const data = { name: 'valid', description: 'Valid', toJSON() { let reads = 0; return { get name() { reads += 1; return reads === 1 ? 'different' : 'valid'; }, description: 'Valid' }; } }; export function execute() {}",
		];

		for (const source of invalidModules) {
			const directory = await fixtureDirectory({ 'bad.js': source });
			await assert.rejects(loadCommands(directory), (error) => {
				const details = safeErrorDetails(error);
				assert.deepEqual(details, {
					context: { file: 'bad.js' },
					reason: 'COMMAND_MODULE_INVALID',
					type: 'OperationalError',
				});
				assert.doesNotMatch(JSON.stringify(details), /SERIALIZER_SECRET/);
				return true;
			});
		}
	});

	it('observes rejected async serializers without exposing their errors', async () => {
		/** @type {unknown[]} */
		const unhandled = [];
		/** @param {unknown} error */
		const listener = (error) => unhandled.push(error);
		process.on('unhandledRejection', listener);

		try {
			for (const source of [
				"export const data = { name: 'valid', description: 'Valid', async toJSON() { throw new Error('SERIALIZER_SECRET'); } }; export function execute() {}",
				"import { runInNewContext } from 'node:vm'; const result = runInNewContext(\"Promise.reject(new Error('CROSS_REALM_SECRET'))\"); result.name = 'valid'; result.description = 'Valid'; export const data = { name: 'valid', description: 'Valid', toJSON() { return result; } }; export function execute() {}",
			]) {
				const directory = await fixtureDirectory({ 'bad.js': source });
				await assert.rejects(loadCommands(directory), (error) => {
					assert.deepEqual(safeErrorDetails(error), {
						context: { file: 'bad.js' },
						reason: 'COMMAND_MODULE_INVALID',
						type: 'OperationalError',
					});
					return true;
				});
			}
			await new Promise((resolve) => setImmediate(resolve));
			assert.deepEqual(unhandled, []);
		} finally {
			process.off('unhandledRejection', listener);
		}
	});

	it('snapshots command fields once during validation', async () => {
		const directory = await fixtureDirectory({
			'stable.js': `
				let reads = 0;
				export const data = {
					get name() {
						reads += 1;
						if (reads > 1) throw new Error('SECOND_READ_SECRET');
						return 'stable';
					},
					description: 'Stable',
					toJSON() { return { name: 'stable', description: 'Stable' }; }
				};
				export function execute() {}
			`,
		});

		const commands = await loadCommands(directory);
		assert.deepEqual([...commands.keys()], ['stable']);
	});

	it('rejects duplicate command names after validating each module', async () => {
		const duplicate = await fixtureDirectory({
			'a.js': "export const data = { name: 'same', description: 'A', toJSON() { return { name: this.name, description: this.description }; } }; export function execute() {}",
			'b.js': "export const data = { name: 'same', description: 'B', toJSON() { return { name: this.name, description: this.description }; } }; export function execute() {}",
		});
		await assert.rejects(loadCommands(duplicate), (error) => {
			assert.deepEqual(safeErrorDetails(error), {
				context: { file: 'b.js' },
				reason: 'COMMAND_NAME_DUPLICATE',
				type: 'OperationalError',
			});
			return true;
		});
	});
});

describe('loadEvents', () => {
	it('loads valid event modules and defaults once to false', async () => {
		const directory = await fixtureDirectory({
			'event.js': "export const name = 'ready'; export async function execute() {}",
		});

		const events = await loadEvents(directory);
		assert.equal(events[0].name, 'ready');
		assert.equal(events[0].once, false);
	});

	it('loads every production event module', async () => {
		const events = await loadEvents(new URL('../src/events/', import.meta.url));
		assert.deepEqual(events.map(({ name }) => name), ['interactionCreate', 'clientReady']);
	});

	it('rejects malformed and duplicate event modules', async () => {
		const malformed = await fixtureDirectory({ 'bad.js': "export const name = 'bad';" });
		await assert.rejects(loadEvents(malformed), (error) => {
			assert.deepEqual(safeErrorDetails(error), {
				context: { file: 'bad.js' },
				reason: 'EVENT_MODULE_INVALID',
				type: 'OperationalError',
			});
			return true;
		});

		const duplicate = await fixtureDirectory({
			'a.js': "export const name = 'ready'; export function execute() {}",
			'b.js': "export const name = 'ready'; export function execute() {}",
		});
		await assert.rejects(loadEvents(duplicate), (error) => {
			assert.deepEqual(safeErrorDetails(error), {
				context: { file: 'b.js' },
				reason: 'EVENT_NAME_DUPLICATE',
				type: 'OperationalError',
			});
			return true;
		});
	});

	it('rejects empty event names and invalid once values', async () => {
		for (const source of [
			"export const name = ' '; export function execute() {}",
			"export const name = 'ready'; export const once = 'yes'; export function execute() {}",
			"export const name = 'ready'; export const once = undefined; export function execute() {}",
		]) {
			const directory = await fixtureDirectory({ 'bad.js': source });
			await assert.rejects(loadEvents(directory), (error) => {
				assert.deepEqual(safeErrorDetails(error), {
					context: { file: 'bad.js' },
					reason: 'EVENT_MODULE_INVALID',
					type: 'OperationalError',
				});
				return true;
			});
		}
	});
});
