import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import * as interactionCreate from '../src/events/interaction-create.js';
import * as ready from '../src/events/ready.js';

describe('event adapters', () => {
	it('forwards interaction events to the router', async () => {
		const execute = mock.fn();
		const interaction = {
			client: {
				commands: new Map([['ping', { execute }]]),
				logger: { error: mock.fn() },
			},
			commandName: 'ping',
			isChatInputCommand: () => true,
		};

		await interactionCreate.execute(
			/** @type {import('discord.js').Interaction} */ (
				/** @type {unknown} */ (interaction)
			),
		);

		assert.equal(execute.mock.callCount(), 1);
		assert.equal(execute.mock.calls[0].arguments[0], interaction);
	});

	it('logs the ready user and handles an unexpectedly unavailable user', () => {
		const logger = { info: mock.fn() };

		ready.execute({ logger, user: { tag: 'StagingBot#1234' } });
		ready.execute({ logger, user: null });

		assert.equal(
			logger.info.mock.calls[0].arguments[0],
			'Ready! Logged in as StagingBot#1234',
		);
		assert.equal(
			logger.info.mock.calls[1].arguments[0],
			'Ready! Logged in as unknown user',
		);
	});
});
