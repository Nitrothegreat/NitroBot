import { createClient } from './client.js';
import { loadConfig } from './config.js';
import { loadCommands, loadEvents } from './loaders.js';

const commandsDirectory = new URL('./commands/', import.meta.url);
const eventsDirectory = new URL('./events/', import.meta.url);

async function main() {
	const config = loadConfig();
	const [commands, events] = await Promise.all([
		loadCommands(commandsDirectory),
		loadEvents(eventsDirectory),
	]);
	const client = createClient({ commands, events });

	for (const signal of ['SIGINT', 'SIGTERM']) {
		process.once(signal, () => {
			console.info(`Received ${signal}; disconnecting from Discord.`);
			client.destroy();
		});
	}

	await client.login(config.token);
}

main().catch((error) => {
	console.error('NitroBot failed to start.', error);
	process.exitCode = 1;
});
