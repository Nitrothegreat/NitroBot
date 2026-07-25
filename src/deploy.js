import { REST, Routes } from 'discord.js';
import { OperationalError } from './errors.js';

/**
 * @typedef {object} Command
 * @property {{ toJSON: () => unknown }} data
 */

/** @typedef {Pick<REST, 'put'>} RestClient */

/**
 * @param {Command[]} commands
 * @returns {unknown[]}
 */
export function buildCommandPayload(commands) {
	return commands.map(({ data }) => data.toJSON());
}

/**
 * @param {{ clientId: string, guildId: string, token: string }} config
 * @param {Command[]} commands
 * @param {Pick<Console, 'info'>} [logger=console]
 * @param {(token: string) => RestClient} [restFactory]
 * @returns {Promise<unknown[]>}
 */
export async function deployCommands(
	{ clientId, guildId, token },
	commands,
	logger = console,
	restFactory = (restToken) => new REST({ version: '10' }).setToken(restToken),
) {
	if (commands.length === 0) {
		throw new OperationalError('DEPLOY_COMMAND_SET_EMPTY');
	}

	const payload = buildCommandPayload(commands);
	const rest = restFactory(token);

	logger.info(`Deploying ${payload.length} guild command(s).`);
	const data = await rest.put(
		Routes.applicationGuildCommands(clientId, guildId),
		{ body: payload },
	);

	if (!Array.isArray(data)) {
		throw new OperationalError('DEPLOY_RESPONSE_INVALID');
	}

	logger.info(`Successfully deployed ${data.length} guild command(s).`);

	return data;
}
