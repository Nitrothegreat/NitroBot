import { REST, Routes } from 'discord.js';

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
	const payload = buildCommandPayload(commands);
	const rest = restFactory(token);

	logger.info(`Deploying ${payload.length} guild command(s).`);
	const data = await rest.put(
		Routes.applicationGuildCommands(clientId, guildId),
		{ body: payload },
	);

	if (!Array.isArray(data)) {
		throw new Error('Discord returned an invalid command deployment response');
	}

	logger.info(`Successfully deployed ${data.length} guild command(s).`);

	return data;
}
