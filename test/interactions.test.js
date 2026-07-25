import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { MessageFlags } from 'discord.js';
import { handleInteraction } from '../src/interactions.js';

/**
 * @param {Record<string, unknown>} [overrides]
 * @returns {any}
 */
function createInteraction(overrides = {}) {
	return {
		client: {
			commands: new Map(),
			logger: { error: mock.fn() },
		},
		commandName: 'ping',
		deferred: false,
		editReply: mock.fn(),
		followUp: mock.fn(),
		isChatInputCommand: () => true,
		replied: false,
		reply: mock.fn(),
		...overrides,
	};
}

describe('handleInteraction', () => {
	it('ignores interactions that are not chat-input commands', async () => {
		const interaction = createInteraction({ isChatInputCommand: () => false });

		await handleInteraction(interaction);

		assert.equal(interaction.reply.mock.callCount(), 0);
	});

	it('dispatches a known command', async () => {
		const execute = mock.fn();
		const interaction = createInteraction();
		interaction.client.commands.set('ping', { execute });

		await handleInteraction(interaction);

		assert.equal(execute.mock.callCount(), 1);
		assert.equal(execute.mock.calls[0].arguments[0], interaction);
	});

	it('privately reports an unknown command', async () => {
		const interaction = createInteraction();

		await handleInteraction(interaction);

		assert.deepEqual(interaction.reply.mock.calls[0].arguments[0], {
			content: 'That command is currently unavailable.',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('privately reports a command failure before acknowledgement', async () => {
		const interaction = createInteraction();
		const privateMessage = 'PRIVATE_RESPONSE_SENTINEL';
		const token = 'INTERACTION_TOKEN_SENTINEL';
		const error = Object.assign(new Error(privateMessage), {
			code: 10_062,
			requestBody: { content: privateMessage },
			status: 401,
			url: `https://discord.com/interactions/123/${token}/callback`,
		});
		interaction.client.commands.set('ping', {
			execute: async () => { throw error; },
		});

		await handleInteraction(interaction);

		assert.deepEqual(interaction.reply.mock.calls[0].arguments[0], {
			content: 'Something went wrong while running that command.',
			flags: MessageFlags.Ephemeral,
		});
		assert.deepEqual(interaction.client.logger.error.mock.calls[0].arguments, [
			'Command failed: ping',
			{ code: 10_062, status: 401, type: 'Error' },
		]);
		const logged = JSON.stringify(interaction.client.logger.error.mock.calls);
		assert.doesNotMatch(logged, new RegExp(privateMessage));
		assert.doesNotMatch(logged, new RegExp(token));
	});

	it('edits a deferred reply after failure', async () => {
		const interaction = createInteraction({ deferred: true });
		interaction.client.commands.set('ping', {
			execute: async () => { throw new Error('failure'); },
		});

		await handleInteraction(interaction);

		assert.deepEqual(interaction.editReply.mock.calls[0].arguments[0], {
			content: 'Something went wrong while running that command.',
		});
	});

	it('follows up privately after a reply has already been sent', async () => {
		const interaction = createInteraction({ replied: true });
		interaction.client.commands.set('ping', {
			execute: async () => { throw new Error('failure'); },
		});

		await handleInteraction(interaction);

		assert.deepEqual(interaction.followUp.mock.calls[0].arguments[0], {
			content: 'Something went wrong while running that command.',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('follows up after a deferred reply has already been edited', async () => {
		const interaction = createInteraction({ deferred: true, replied: true });
		interaction.client.commands.set('ping', {
			execute: async () => { throw new Error('failure'); },
		});

		await handleInteraction(interaction);

		assert.equal(interaction.editReply.mock.callCount(), 0);
		assert.deepEqual(interaction.followUp.mock.calls[0].arguments[0], {
			content: 'Something went wrong while running that command.',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('logs a response failure without throwing it', async () => {
		const token = 'FAILED_RESPONSE_TOKEN_SENTINEL';
		const interaction = createInteraction({
			reply: async () => {
				throw Object.assign(new Error('private failure'), {
					requestBody: { content: 'private response' },
					url: `https://discord.com/interactions/123/${token}/callback`,
				});
			},
		});

		await handleInteraction(interaction);

		assert.equal(interaction.client.logger.error.mock.callCount(), 2);
		assert.doesNotMatch(
			JSON.stringify(interaction.client.logger.error.mock.calls),
			new RegExp(token),
		);
	});
});
