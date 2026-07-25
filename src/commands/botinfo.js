import { createRequire } from 'node:module';
import { EmbedBuilder, SlashCommandBuilder, version as discordJsVersion } from 'discord.js';

const UNAVAILABLE = 'Unavailable';
const require = createRequire(import.meta.url);
const packageMetadata = /** @type {{ version: string }} */ (require('../../package.json'));

export const data = new SlashCommandBuilder()
	.setName('botinfo')
	.setDescription('Displays information about NitroBot.');

/**
 * @param {number} milliseconds
 */
export function formatDuration(milliseconds) {
	if (!isValidMetric(milliseconds)) {
		return UNAVAILABLE;
	}

	const totalSeconds = Math.floor(milliseconds / 1000);
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor(totalSeconds % 86_400 / 3_600);
	const minutes = Math.floor(totalSeconds % 3_600 / 60);
	const seconds = totalSeconds % 60;
	const parts = [];

	if (days > 0) {
		parts.push(`${days}d`);
	}
	if (days > 0 || hours > 0) {
		parts.push(`${hours}h`);
	}
	if (days > 0 || hours > 0 || minutes > 0) {
		parts.push(`${minutes}m`);
	}
	parts.push(`${seconds}s`);

	return parts.join(' ');
}

/**
 * @param {number} milliseconds
 */
export function formatLatency(milliseconds) {
	if (!isValidMetric(milliseconds)) {
		return UNAVAILABLE;
	}

	return `${Math.round(milliseconds)} ms`;
}

/**
 * @param {{ latency: number, uptime: number }} metrics
 */
export function createBotInfoEmbed(metrics) {
	return new EmbedBuilder()
		.setTitle('NitroBot Information')
		.addFields(
			{ name: 'NitroBot Version', value: packageMetadata.version },
			{ name: 'Uptime', value: formatDuration(metrics.uptime) },
			{ name: 'WebSocket Latency', value: formatLatency(metrics.latency) },
			{ name: 'Node.js Version', value: process.version },
			{ name: 'discord.js Version', value: discordJsVersion },
		);
}

/** @param {unknown} value */
function isValidMetric(value) {
	return typeof value === 'number'
		&& Number.isFinite(value)
		&& value >= 0
		&& value <= Number.MAX_SAFE_INTEGER;
}

/**
 * @param {{
 *   client: { uptime?: number | null, ws?: { ping?: number | null } },
 *   reply: (options: { embeds: EmbedBuilder[] }) => unknown
 * }} interaction
 */
export async function execute(interaction) {
	const uptime = interaction.client.uptime;
	const latency = interaction.client.ws?.ping;
	const embed = createBotInfoEmbed({
		latency: /** @type {number} */ (latency),
		uptime: /** @type {number} */ (uptime),
	});

	await interaction.reply({ embeds: [embed] });
}
