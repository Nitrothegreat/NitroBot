import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { MessageFlags } from 'discord.js';
import * as ping from '../src/commands/ping.js';
import * as secretping from '../src/commands/secretping.js';
import * as server from '../src/commands/server.js';
import * as sourcecode from '../src/commands/sourcecode.js';
import * as user from '../src/commands/user.js';

const commands = [ping, secretping, server, sourcecode, user];

describe('commands', () => {
	it('exports unique, serializable definitions and handlers', () => {
		const names = commands.map((command) => command.data.name);

		assert.deepEqual(names, [
			'ping',
			'secretping',
			'server',
			'sourcecode',
			'user',
		]);
		assert.equal(new Set(names).size, commands.length);
		for (const command of commands) {
			assert.equal(typeof command.data.toJSON, 'function');
			assert.equal(typeof command.execute, 'function');
		}
	});

	it('runs ping', async () => {
		const interaction = { reply: mock.fn() };
		await ping.execute(interaction);
		assert.equal(interaction.reply.mock.calls[0].arguments[0], 'Pong!');
	});

	it('runs secretping privately', async () => {
		const interaction = { reply: mock.fn() };
		await secretping.execute(interaction);
		assert.deepEqual(interaction.reply.mock.calls[0].arguments[0], {
			content: 'Pong!',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('reports server details and handles missing guild context', async () => {
		const reply = mock.fn();
		await server.execute({ guild: { memberCount: 42, name: 'Test Server' }, reply });
		assert.equal(reply.mock.calls[0].arguments[0], 'This server is Test Server and has 42 members.');

		await server.execute({ guild: null, reply });
		assert.equal(reply.mock.calls[1].arguments[0].flags, MessageFlags.Ephemeral);
	});

	it('returns the source repository', async () => {
		const interaction = { reply: mock.fn() };
		await sourcecode.execute(interaction);
		assert.equal(interaction.reply.mock.calls[0].arguments[0], 'https://github.com/Nitrothegreat/NitroBot');
	});

	it('reports user details and handles a missing join date', async () => {
		const joinedAt = new Date('2022-01-01T00:00:00Z');
		const reply = mock.fn();
		await user.execute({ member: { joinedAt }, reply, user: { username: 'Nitro' } });
		assert.equal(
			reply.mock.calls[0].arguments[0],
			`This command was run by Nitro, who joined on ${joinedAt}.`,
		);

		await user.execute({ member: null, reply, user: { username: 'Nitro' } });
		assert.equal(reply.mock.calls[1].arguments[0].flags, MessageFlags.Ephemeral);
	});
});
