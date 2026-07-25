/**
 * Returns allowlisted diagnostic fields without retaining error messages,
 * request data, URLs, headers, response bodies, or credentials.
 *
 * @param {unknown} error
 * @returns {{ type: 'Error' | 'UnknownError', code?: number, status?: number }}
 */
export function safeErrorDetails(error) {
	if (!(error instanceof Error)) {
		return { type: 'UnknownError' };
	}

	const details = /** @type {{
	 *   type: 'Error',
	 *   code?: number,
	 *   status?: number
	 * }} */ ({ type: 'Error' });
	const candidate = /** @type {{ code?: unknown, status?: unknown }} */ (error);

	if (Number.isSafeInteger(candidate.code)) {
		details.code = /** @type {number} */ (candidate.code);
	}

	if (
		Number.isSafeInteger(candidate.status)
		&& /** @type {number} */ (candidate.status) >= 100
		&& /** @type {number} */ (candidate.status) <= 599
	) {
		details.status = /** @type {number} */ (candidate.status);
	}

	return details;
}
