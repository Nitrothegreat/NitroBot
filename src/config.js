import { OperationalError } from './errors.js';

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;

/**
 * Reads and validates NitroBot's configuration without exposing secret values
 * in validation errors.
 *
 * @param {NodeJS.ProcessEnv} [environment=process.env]
 * @returns {{ token: string, clientId: string, guildId: string }}
 */
export function loadConfig(environment = process.env) {
	const token = requireValue(environment, 'DISCORD_TOKEN');
	const clientId = requireSnowflake(environment, 'DISCORD_CLIENT_ID');
	const guildId = requireSnowflake(environment, 'DISCORD_GUILD_ID');

	return Object.freeze({ token, clientId, guildId });
}

/**
 * @param {NodeJS.ProcessEnv} environment
 * @param {string} name
 */
function requireValue(environment, name) {
	const value = environment[name]?.trim();

	if (!value) {
		throw new OperationalError('CONFIG_VARIABLE_MISSING', { variable: name });
	}

	return value;
}

/**
 * @param {NodeJS.ProcessEnv} environment
 * @param {string} name
 */
function requireSnowflake(environment, name) {
	const value = requireValue(environment, name);

	if (!SNOWFLAKE_PATTERN.test(value)) {
		throw new OperationalError('CONFIG_DISCORD_ID_INVALID', { variable: name });
	}

	return value;
}
