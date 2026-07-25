import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import * as avatar from '../src/commands/avatar.js';
import * as help from '../src/commands/help.js';
import * as ping from '../src/commands/ping.js';
import * as secretping from '../src/commands/secretping.js';
import * as server from '../src/commands/server.js';
import * as sourcecode from '../src/commands/sourcecode.js';
import * as user from '../src/commands/user.js';

const commands = [avatar, help, ping, secretping, server, sourcecode, user];

describe('commands', () => {
	it('exports unique, serializable definitions and handlers', () => {
		const names = commands.map((command) => command.data.name);

		assert.deepEqual(names, [
			'avatar',
			'help',
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

	it('defines avatar with an optional target user', () => {
		const definition = avatar.data.toJSON();
		assert.equal(definition.name, 'avatar');
		assert.equal(definition.description, 'Displays a user\'s avatar.');
		assert.deepEqual(definition.options, [{
			description: 'The user whose avatar to display.',
			description_localizations: undefined,
			name: 'target',
			name_localizations: undefined,
			required: false,
			type: ApplicationCommandOptionType.User,
		}]);
	});

	it('displays the caller avatar publicly by default', async () => {
		const displayAvatarURL = mock.fn((options) => {
			void options;
			return 'https://cdn.discordapp.com/avatars/caller/avatar.png?size=1024';
		});
		const reply = mock.fn();

		await avatar.execute({
			options: { getUser: mock.fn(() => null) },
			reply,
			user: { displayAvatarURL, username: 'Caller' },
		});

		assert.deepEqual(displayAvatarURL.mock.calls[0].arguments[0], {
			extension: 'png',
			forceStatic: true,
			size: 1024,
		});
		assert.deepEqual(reply.mock.calls[0].arguments[0].embeds[0].toJSON(), {
			image: { url: 'https://cdn.discordapp.com/avatars/caller/avatar.png?size=1024' },
			title: 'Caller\'s Avatar',
		});
		assert.equal('content' in reply.mock.calls[0].arguments[0], false);
		assert.equal('flags' in reply.mock.calls[0].arguments[0], false);
	});

	it('displays a selected target avatar instead of the caller avatar', async () => {
		const callerAvatarURL = mock.fn(() => 'https://cdn.discordapp.com/avatars/caller/avatar.png');
		const targetAvatarURL = mock.fn((options) => {
			void options;
			return 'https://cdn.discordapp.com/avatars/target/avatar.png?size=1024';
		});
		const target = { displayAvatarURL: targetAvatarURL, username: 'Target' };
		const getUser = mock.fn((name) => {
			void name;
			return target;
		});
		const reply = mock.fn();

		await avatar.execute({
			options: { getUser },
			reply,
			user: { displayAvatarURL: callerAvatarURL, username: 'Caller' },
		});

		assert.equal(getUser.mock.calls[0].arguments[0], 'target');
		assert.equal(callerAvatarURL.mock.callCount(), 0);
		assert.deepEqual(targetAvatarURL.mock.calls[0].arguments[0], {
			extension: 'png',
			forceStatic: true,
			size: 1024,
		});
		assert.deepEqual(reply.mock.calls[0].arguments[0].embeds[0].toJSON(), {
			image: { url: 'https://cdn.discordapp.com/avatars/target/avatar.png?size=1024' },
			title: 'Target\'s Avatar',
		});
	});

	it('uses the default Discord avatar returned for a user without a custom avatar', async () => {
		const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/3.png';
		const displayAvatarURL = mock.fn(() => defaultAvatar);
		const reply = mock.fn();

		await avatar.execute({
			options: { getUser: mock.fn(() => null) },
			reply,
			user: { displayAvatarURL, username: 'Default User' },
		});

		assert.equal(
			reply.mock.calls[0].arguments[0].embeds[0].toJSON().image.url,
			defaultAvatar,
		);
	});

	it('defines help without options', () => {
		const definition = help.data.toJSON();
		assert.equal(definition.name, 'help');
		assert.equal(definition.description, 'Lists the bot\'s available commands.');
		assert.deepEqual(definition.options, []);
	});

	it('lists registered commands alphabetically in a private embed', async () => {
		const followUp = mock.fn();
		const reply = mock.fn();
		const registeredCommands = new Map([
			['zebra', {
				data: { description: 'A dynamically registered command.', name: 'zebra' },
			}],
			['alpha', {
				data: { description: 'The first command alphabetically.', name: 'alpha' },
			}],
		]);

		await help.execute({
			client: { commands: registeredCommands },
			followUp,
			reply,
		});

		const response = reply.mock.calls[0].arguments[0];
		assert.equal(response.flags, MessageFlags.Ephemeral);
		assert.equal(response.embeds.length, 1);
		assert.deepEqual(response.embeds[0].toJSON(), {
			description: [
				'**/alpha** — The first command alphabetically.',
				'**/zebra** — A dynamically registered command.',
			].join('\n'),
			title: 'Available Commands',
		});
		assert.deepEqual([...registeredCommands.keys()], ['zebra', 'alpha']);
		assert.equal(followUp.mock.callCount(), 0);
	});

	it('reports an empty command collection privately', async () => {
		const reply = mock.fn();

		await help.execute({
			client: { commands: new Map() },
			followUp: mock.fn(),
			reply,
		});

		assert.deepEqual(reply.mock.calls[0].arguments[0], {
			content: 'No commands are currently available.',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('privately lists every command when the output requires multiple embeds', async () => {
		const followUp = mock.fn();
		const reply = mock.fn();
		const registeredCommands = new Map(Array.from({ length: 100 }, (_, index) => {
			const name = `command-${String(index).padStart(3, '0')}`;
			return [name, {
				data: {
					description: `Description ${String(index).padStart(3, '0')} ${'x'.repeat(82)}`,
					name,
				},
			}];
		}));

		await help.execute({
			client: { commands: registeredCommands },
			followUp,
			reply,
		});

		const responses = [
			reply.mock.calls[0].arguments[0],
			...followUp.mock.calls.map((call) => call.arguments[0]),
		];
		const descriptions = responses.map((response) => {
			assert.equal(response.flags, MessageFlags.Ephemeral);
			assert.equal(response.embeds.length, 1);
			const description = response.embeds[0].toJSON().description;
			assert.ok(description.length <= 4096);
			return description;
		});
		const displayed = descriptions.join('\n');

		assert.ok(responses.length > 1);
		for (const command of registeredCommands.values()) {
			assert.match(displayed, new RegExp(`\\*\\*/${command.data.name}\\*\\* — ${command.data.description}`));
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
