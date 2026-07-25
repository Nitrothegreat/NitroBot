import { SlashCommandBuilder } from 'discord.js';

const DEFAULT_SIDES = 6;
const MINIMUM_SIDES = 2;
const MAXIMUM_SIDES = 1000;

export const data = new SlashCommandBuilder()
	.setName('roll')
	.setDescription('Rolls a die.')
	.addIntegerOption((option) => option
		.setName('sides')
		.setDescription('The number of sides on the die.')
		.setMinValue(MINIMUM_SIDES)
		.setMaxValue(MAXIMUM_SIDES)
		.setRequired(false));

/**
 * Rolls one die using a Math.random-compatible source.
 *
 * @param {number} sides
 * @param {() => number} [random]
 */
export function rollDie(sides, random = Math.random) {
	if (!Number.isInteger(sides) || sides < MINIMUM_SIDES || sides > MAXIMUM_SIDES) {
		throw new RangeError('Sides must be an integer between 2 and 1000.');
	}

	if (typeof random !== 'function') {
		throw new TypeError('Random source must be a function.');
	}

	const sample = random();
	if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
		throw new RangeError('Random source must return a number from 0 up to, but not including, 1.');
	}

	return Math.floor(sample * sides) + 1;
}

/**
 * @param {{
 *   options: { getInteger: (name: string) => number | null },
 *   reply: (content: string) => unknown
 * }} interaction
 */
export async function execute(interaction) {
	const sides = interaction.options.getInteger('sides') ?? DEFAULT_SIDES;
	const result = rollDie(sides);
	await interaction.reply(`You rolled ${result} (d${sides}).`);
}
