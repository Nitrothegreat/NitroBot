import assert from 'node:assert/strict';
import { setImmediate as waitForImmediate } from 'node:timers/promises';
import { describe, it, mock } from 'node:test';
import { Collection, GatewayIntentBits } from 'discord.js';
import { createClient } from '../src/client.js';

function createFakeClient() {
	const listeners = { on: new Map(), once: new Map() };
	const client = {
		on: mock.fn((name, listener) => listeners.on.set(name, listener)),
		once: mock.fn((name, listener) => listeners.once.set(name, listener)),
	};

	return { client, listeners };
}

describe('createClient', () => {
	it('uses minimal intents, attaches dependencies, and registers on/once events', () => {
		const commands = new Collection();
		const logger = { error: mock.fn(), info: mock.fn() };
		const { client, listeners } = createFakeClient();
		const clientFactory = mock.fn((_options) => client);
		const events = [
			{ execute: mock.fn(), name: 'message', once: false },
			{ execute: mock.fn(), name: 'ready', once: true },
		];

		const result = createClient({ clientFactory, commands, events, logger });

		assert.equal(result, client);
		assert.deepEqual(clientFactory.mock.calls[0].arguments[0], {
			allowedMentions: { parse: [] },
			intents: [GatewayIntentBits.Guilds],
		});
		assert.equal(result.commands, commands);
		assert.equal(result.logger, logger);
		assert.ok(listeners.on.has('message'));
		assert.ok(listeners.once.has('ready'));
	});

	it('forwards event arguments and logs synchronous and asynchronous failures', async () => {
		const syncError = new Error('sync failure');
		const asyncError = new Error('async failure');
		const logger = { error: mock.fn(), info: mock.fn() };
		const { client, listeners } = createFakeClient();
		const executeSuccess = mock.fn();

		createClient({
			clientFactory: (_options) => client,
			commands: new Collection(),
			events: [
				{ execute: executeSuccess, name: 'success', once: false },
				{ execute: () => { throw syncError; }, name: 'sync', once: false },
				{ execute: async () => { throw asyncError; }, name: 'async', once: false },
			],
			logger,
		});

		listeners.on.get('success')('one', 2);
		listeners.on.get('sync')();
		listeners.on.get('async')();
		await waitForImmediate();

		assert.deepEqual(executeSuccess.mock.calls[0].arguments, ['one', 2]);
		assert.equal(logger.error.mock.callCount(), 2);
		assert.deepEqual(logger.error.mock.calls[0].arguments, [
			'Unhandled error in sync event',
			{ type: 'Error' },
		]);
		assert.deepEqual(logger.error.mock.calls[1].arguments, [
			'Unhandled error in async event',
			{ type: 'Error' },
		]);
	});
});
