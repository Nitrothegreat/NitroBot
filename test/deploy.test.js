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

	it('supports an empty deployment response', async () => {
		const logger = { info: mock.fn() };

		const result = await deployCommands(
			{ clientId: '1', guildId: '2', token: 'token' },
			[],
			logger,
			() => ({ put: async () => [] }),
		);

		assert.deepEqual(result, []);
		assert.match(logger.info.mock.calls[1].arguments[0], /deployed 0 guild command/);
	});

	it('rejects invalid or failed REST responses without logging success', async () => {
		const invalidLogger = { info: mock.fn() };
		await assert.rejects(
			deployCommands(
				{ clientId: '1', guildId: '2', token: 'token' },
				[],
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
				[],
				failedLogger,
				() => ({ put: async () => { throw restError; } }),
			),
			(error) => error === restError,
		);
		assert.equal(failedLogger.info.mock.callCount(), 1);
	});
});
