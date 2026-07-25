import { loadConfig } from '../src/config.js';
import { deployCommands } from '../src/deploy.js';
import { safeErrorDetails } from '../src/errors.js';
import { loadCommands } from '../src/loaders.js';

async function main() {
	const config = loadConfig();
	const commands = await loadCommands(new URL('../src/commands/', import.meta.url));
	await deployCommands(config, [...commands.values()]);
}

main().catch((error) => {
	console.error('Command deployment failed.', safeErrorDetails(error));
	process.exitCode = 1;
});
