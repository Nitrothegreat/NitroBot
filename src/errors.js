const OPERATIONAL_METADATA = new WeakMap();
const CONFIGURATION_VARIABLES = new Set([
	'DISCORD_TOKEN',
	'DISCORD_CLIENT_ID',
	'DISCORD_GUILD_ID',
]);
const MODULE_FILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.js$/;

/**
 * @typedef {'CONFIG_VARIABLE_MISSING'
 *   | 'CONFIG_DISCORD_ID_INVALID'
 *   | 'COMMAND_MODULE_INVALID'
 *   | 'COMMAND_NAME_DUPLICATE'
 *   | 'EVENT_MODULE_INVALID'
 *   | 'EVENT_NAME_DUPLICATE'
 *   | 'DEPLOY_COMMAND_SET_EMPTY'
 *   | 'DEPLOY_RESPONSE_INVALID'
 * } OperationalReason
 */

/**
 * A trusted, locally authored failure with narrowly allowlisted diagnostics.
 */
export class OperationalError extends Error {
	/**
	 * @param {OperationalReason} reason
	 * @param {{ variable?: string, file?: string }} [context]
	 */
	constructor(reason, context = {}) {
		super('NitroBot encountered an operational failure');
		this.name = 'OperationalError';
		OPERATIONAL_METADATA.set(this, Object.freeze({
			context: Object.freeze({ ...context }),
			reason,
		}));
	}
}

/**
 * Returns allowlisted diagnostic fields without retaining error messages,
 * request data, URLs, headers, response bodies, or credentials.
 *
 * @param {unknown} error
 * @returns {{
 *   type: 'OperationalError',
 *   reason: OperationalReason,
 *   context?: { variable: string } | { file: string }
 * } | {
 *   type: 'Error',
 *   code?: number,
 *   status?: number
 * } | {
 *   type: 'UnknownError'
 * }}
 */
export function safeErrorDetails(error) {
	try {
		if (!(error instanceof Error)) {
			return { type: 'UnknownError' };
		}

		const operational = OPERATIONAL_METADATA.get(error);
		if (operational) {
			return operationalErrorDetails(operational);
		}

		const details = /** @type {{
		 *   type: 'Error',
		 *   code?: number,
		 *   status?: number
		 * }} */ ({ type: 'Error' });
		const code = ownDataValue(error, 'code');
		const status = ownDataValue(error, 'status');

		if (Number.isSafeInteger(code)) {
			details.code = /** @type {number} */ (code);
		}

		if (
			Number.isSafeInteger(status)
			&& /** @type {number} */ (status) >= 100
			&& /** @type {number} */ (status) <= 599
		) {
			details.status = /** @type {number} */ (status);
		}

		return details;
	} catch {
		return { type: 'UnknownError' };
	}
}

/**
 * @param {{ reason: OperationalReason, context: { variable?: string, file?: string } }} metadata
 */
function operationalErrorDetails({ reason, context }) {
	if (
		(reason === 'CONFIG_VARIABLE_MISSING' || reason === 'CONFIG_DISCORD_ID_INVALID')
		&& typeof context.variable === 'string'
		&& CONFIGURATION_VARIABLES.has(context.variable)
	) {
		return {
			type: /** @type {const} */ ('OperationalError'),
			reason,
			context: { variable: context.variable },
		};
	}

	if (
		(
			reason === 'COMMAND_MODULE_INVALID'
			|| reason === 'COMMAND_NAME_DUPLICATE'
			|| reason === 'EVENT_MODULE_INVALID'
			|| reason === 'EVENT_NAME_DUPLICATE'
		)
		&& typeof context.file === 'string'
		&& MODULE_FILE_PATTERN.test(context.file)
	) {
		return {
			type: /** @type {const} */ ('OperationalError'),
			reason,
			context: { file: context.file },
		};
	}

	if (reason === 'DEPLOY_COMMAND_SET_EMPTY' || reason === 'DEPLOY_RESPONSE_INVALID') {
		return {
			type: /** @type {const} */ ('OperationalError'),
			reason,
		};
	}

	return { type: /** @type {const} */ ('Error') };
}

/**
 * Reads only an own data property. Accessors and inherited values are ignored.
 *
 * @param {Error} error
 * @param {'code' | 'status'} name
 */
function ownDataValue(error, name) {
	const descriptor = Object.getOwnPropertyDescriptor(error, name);
	return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
