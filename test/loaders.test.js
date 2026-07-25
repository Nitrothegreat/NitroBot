import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, it } from 'node:test';
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
			'b.js': "export const data = { name: 'b', toJSON() {} }; export function execute() {}",
			'a.js': "export const data = { name: 'a', toJSON() {} }; export function execute() {}",
			'ignored.txt': 'not JavaScript',
		});

		const commands = await loadCommands(directory);
		assert.deepEqual([...commands.keys()], ['a', 'b']);
	});

	it('rejects malformed and duplicate command modules', async () => {
		const malformed = await fixtureDirectory({ 'bad.js': 'export const data = {};' });
		await assert.rejects(loadCommands(malformed), /Invalid command module: bad.js/);

		const duplicate = await fixtureDirectory({
			'a.js': "export const data = { name: 'same', toJSON() {} }; export function execute() {}",
			'b.js': "export const data = { name: 'same', toJSON() {} }; export function execute() {}",
		});
		await assert.rejects(loadCommands(duplicate), /Duplicate command name: same/);
	});
});

describe('loadEvents', () => {
	it('loads valid event modules and defaults once to false', async () => {
		const directory = await fixtureDirectory({
			'event.js': "export const name = 'ready'; export function execute() {}",
		});

		const events = await loadEvents(directory);
		assert.equal(events[0].name, 'ready');
		assert.equal(events[0].once, false);
	});

	it('rejects malformed and duplicate event modules', async () => {
		const malformed = await fixtureDirectory({ 'bad.js': "export const name = 'bad';" });
		await assert.rejects(loadEvents(malformed), /Invalid event module: bad.js/);

		const duplicate = await fixtureDirectory({
			'a.js': "export const name = 'ready'; export function execute() {}",
			'b.js': "export const name = 'ready'; export function execute() {}",
		});
		await assert.rejects(loadEvents(duplicate), /Duplicate event name: ready/);
	});

	it('rejects a non-boolean once flag', async () => {
		const directory = await fixtureDirectory({
			'bad.js': "export const name = 'ready'; export const once = 'yes'; export function execute() {}",
		});

		await assert.rejects(loadEvents(directory), /Invalid event module: bad.js/);
	});
});
