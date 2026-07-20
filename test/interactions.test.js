import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { MessageFlags } from 'discord.js';
import { handleInteraction } from '../src/interactions.js';

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
		interaction.client.commands.set('ping', {
			execute: async () => { throw new Error('private details'); },
		});

		await handleInteraction(interaction);

		assert.deepEqual(interaction.reply.mock.calls[0].arguments[0], {
			content: 'Something went wrong while running that command.',
			flags: MessageFlags.Ephemeral,
		});
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

	it('logs a response failure without throwing it', async () => {
		const interaction = createInteraction({
			reply: async () => { throw new Error('network failure'); },
		});

		await handleInteraction(interaction);

		assert.equal(interaction.client.logger.error.mock.callCount(), 2);
	});
});
