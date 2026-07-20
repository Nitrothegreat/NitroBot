import { REST, Routes } from 'discord.js';

export function buildCommandPayload(commands) {
	return commands.map(({ data }) => data.toJSON());
}

export async function deployCommands({ clientId, guildId, token }, commands, logger = console) {
	const payload = buildCommandPayload(commands);
	const rest = new REST({ version: '10' }).setToken(token);

	logger.info(`Deploying ${payload.length} guild command(s).`);
	const data = await rest.put(
		Routes.applicationGuildCommands(clientId, guildId),
		{ body: payload },
	);
	logger.info(`Successfully deployed ${data.length} guild command(s).`);

	return data;
}
