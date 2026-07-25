import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { Routes } from 'discord.js';
import { buildCommandPayload, deployCommands } from '../src/deploy.js';

describe('command deployment', () => {
	it('serializes every command exactly once', () => {
		const commands = [
			{ data: { toJSON: () => ({ name: 'one' }) } },
			{ data: { toJSON: () => ({ name: 'two' }) } },
		];

		assert.deepEqual(buildCommandPayload(commands), [
			{ name: 'one' },
			{ name: 'two' },
		]);
	});

	it('uses the configured token, guild route, payload, and logger', async () => {
		const put = mock.fn(async (_route, _options) => [{ id: 'deployed' }]);
		const restFactory = mock.fn((_token) => ({ put }));
		const logger = { info: mock.fn((_message) => {}) };
		const config = {
			clientId: '12345678901234567',
			guildId: '98765432109876543',
			token: 'secret-token',
		};
		const commands = [{ data: { toJSON: () => ({ name: 'ping' }) } }];

		const result = await deployCommands(config, commands, logger, restFactory);

		assert.deepEqual(result, [{ id: 'deployed' }]);
		assert.equal(restFactory.mock.calls[0].arguments[0], 'secret-token');
		assert.equal(
			put.mock.calls[0].arguments[0],
			Routes.applicationGuildCommands(config.clientId, config.guildId),
		);
		assert.deepEqual(put.mock.calls[0].arguments[1], {
			body: [{ name: 'ping' }],
		});
		assert.equal(logger.info.mock.callCount(), 2);
		assert.match(logger.info.mock.calls[0].arguments[0], /Deploying 1 guild command/);
		assert.match(logger.info.mock.calls[1].arguments[0], /Successfully deployed 1 guild command/);
	});

	it('rejects an empty command set before crossing deployment boundaries', async () => {
		const secretToken = 'EMPTY_DEPLOY_SECRET_SENTINEL';
		const put = mock.fn(async () => []);
		const restFactory = mock.fn((_token) => ({ put }));
		const logger = { info: mock.fn() };
		let serializationAttempted = false;
		/** @type {{ data: { toJSON: () => unknown } }[]} */
		const commands = new Proxy([], {
			get(target, property, receiver) {
				if (property === 'map') {
					serializationAttempted = true;
				}
				return Reflect.get(target, property, receiver);
			},
		});

		await assert.rejects(
			deployCommands(
				{ clientId: '1', guildId: '2', token: secretToken },
				commands,
				logger,
				restFactory,
			),
			(error) => {
				assert.ok(error instanceof Error);
				assert.equal(error.message, 'Refusing to deploy an empty command set');
				assert.doesNotMatch(error.message, new RegExp(secretToken));
				return true;
			},
		);

		assert.equal(serializationAttempted, false);
		assert.equal(logger.info.mock.callCount(), 0);
		assert.equal(restFactory.mock.callCount(), 0);
		assert.equal(put.mock.callCount(), 0);
	});

	it('supports an empty deployment response', async () => {
		const logger = { info: mock.fn() };
		const commands = [{ data: { toJSON: () => ({ name: 'ping' }) } }];

		const result = await deployCommands(
			{ clientId: '1', guildId: '2', token: 'token' },
			commands,
			logger,
			() => ({ put: async () => [] }),
		);

		assert.deepEqual(result, []);
		assert.match(logger.info.mock.calls[1].arguments[0], /deployed 0 guild command/);
	});

	it('rejects invalid or failed REST responses without logging success', async () => {
		const commands = [{ data: { toJSON: () => ({ name: 'ping' }) } }];
		const invalidLogger = { info: mock.fn() };
		await assert.rejects(
			deployCommands(
				{ clientId: '1', guildId: '2', token: 'token' },
				commands,
				invalidLogger,
				() => ({ put: async () => ({ unexpected: true }) }),
			),
			/invalid command deployment response/,
		);
		assert.equal(invalidLogger.info.mock.callCount(), 1);

		const restError = new Error('request failed');
		const failedLogger = { info: mock.fn() };
		await assert.rejects(
			deployCommands(
				{ clientId: '1', guildId: '2', token: 'token' },
				commands,
				failedLogger,
				() => ({ put: async () => { throw restError; } }),
			),
			(error) => error === restError,
		);
		assert.equal(failedLogger.info.mock.callCount(), 1);
	});
});
