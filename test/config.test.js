import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadConfig } from '../src/config.js';

const validEnvironment = {
	DISCORD_TOKEN: 'secret-token',
	DISCORD_CLIENT_ID: '12345678901234567',
	DISCORD_GUILD_ID: '98765432109876543',
};

describe('loadConfig', () => {
	it('returns trimmed, immutable configuration', () => {
		const config = loadConfig({
			...validEnvironment,
			DISCORD_TOKEN: '  secret-token  ',
		});

		assert.deepEqual(config, {
			token: 'secret-token',
			clientId: validEnvironment.DISCORD_CLIENT_ID,
			guildId: validEnvironment.DISCORD_GUILD_ID,
		});
		assert.ok(Object.isFrozen(config));
	});

	for (const name of Object.keys(validEnvironment)) {
		it(`rejects a missing ${name} without exposing other values`, () => {
			const environment = { ...validEnvironment };
			delete environment[name];

			assert.throws(
				() => loadConfig(environment),
				(error) => error.message.includes(name) && !error.message.includes('secret-token'),
			);
		});
	}

	it('rejects malformed Discord IDs', () => {
		assert.throws(
			() => loadConfig({ ...validEnvironment, DISCORD_GUILD_ID: 'not-an-id' }),
			/DISCORD_GUILD_ID must be a valid Discord ID/,
		);
	});
});
