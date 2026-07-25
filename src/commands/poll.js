import { MessageFlags, SlashCommandBuilder } from 'discord.js';

const QUESTION_VALIDATION_MESSAGE = 'Poll questions must contain 1 to 300 characters.';
const OPTION_VALIDATION_MESSAGE = 'Poll options must contain 1 to 55 characters.';
const DUPLICATE_OPTION_MESSAGE = 'Poll options must be unique.';

export const data = new SlashCommandBuilder()
	.setName('poll')
	.setDescription('Creates a 24-hour single-choice poll.')
	.addStringOption((option) => option
		.setName('question')
		.setDescription('The poll question.')
		.setMaxLength(300)
		.setRequired(true))
	.addStringOption((option) => option
		.setName('option1')
		.setDescription('The first poll option.')
		.setMaxLength(55)
		.setRequired(true))
	.addStringOption((option) => option
		.setName('option2')
		.setDescription('The second poll option.')
		.setMaxLength(55)
		.setRequired(true))
	.addStringOption((option) => option
		.setName('option3')
		.setDescription('The third poll option.')
		.setMaxLength(55)
		.setRequired(false))
	.addStringOption((option) => option
		.setName('option4')
		.setDescription('The fourth poll option.')
		.setMaxLength(55)
		.setRequired(false))
	.addStringOption((option) => option
		.setName('option5')
		.setDescription('The fifth poll option.')
		.setMaxLength(55)
		.setRequired(false));

/**
 * @param {{
 *   options: {
 *     getString: (name: string, required?: boolean) => string | null
 *   },
 *   reply: (options: {
 *     content?: string,
 *     flags?: number,
 *     poll?: {
 *       question: { text: string },
 *       answers: { text: string }[],
 *       duration: number,
 *       allowMultiselect: boolean
 *     }
 *   }) => unknown
 * }} interaction
 */
export async function execute(interaction) {
	const questionValue = interaction.options.getString('question', true);
	const answerValues = [
		interaction.options.getString('option1', true),
		interaction.options.getString('option2', true),
		interaction.options.getString('option3'),
		interaction.options.getString('option4'),
		interaction.options.getString('option5'),
	];

	if (typeof questionValue !== 'string') {
		await validationReply(interaction, QUESTION_VALIDATION_MESSAGE);
		return;
	}

	const question = questionValue.trim();
	if (question.length === 0 || question.length > 300) {
		await validationReply(interaction, QUESTION_VALIDATION_MESSAGE);
		return;
	}

	const suppliedAnswers = answerValues.filter((answer) => answer !== null);
	if (
		suppliedAnswers.length < 2
		|| suppliedAnswers.length > 5
		|| suppliedAnswers.some((answer) => typeof answer !== 'string')
	) {
		await validationReply(interaction, OPTION_VALIDATION_MESSAGE);
		return;
	}

	const answers = /** @type {string[]} */ (suppliedAnswers).map((answer) => answer.trim());
	if (answers.some((answer) => answer.length === 0 || answer.length > 55)) {
		await validationReply(interaction, OPTION_VALIDATION_MESSAGE);
		return;
	}

	const comparisonKeys = answers.map((answer) => answer.toLowerCase());
	if (new Set(comparisonKeys).size !== comparisonKeys.length) {
		await validationReply(interaction, DUPLICATE_OPTION_MESSAGE);
		return;
	}

	await interaction.reply({
		poll: {
			question: { text: question },
			answers: answers.map((text) => ({ text })),
			duration: 24,
			allowMultiselect: false,
		},
	});
}

/**
 * @param {{ reply: (options: { content: string, flags: number }) => unknown }} interaction
 * @param {string} content
 */
async function validationReply(interaction, content) {
	await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}
