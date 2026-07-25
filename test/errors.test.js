import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeErrorDetails } from '../src/errors.js';

describe('safeErrorDetails', () => {
	it('keeps only numeric diagnostic fields from errors', () => {
		const error = Object.assign(new Error('SECRET_MESSAGE'), {
			code: 10_062,
			headers: { authorization: 'SECRET_HEADER' },
			requestBody: { content: 'PRIVATE_CONTENT' },
			status: 429,
			url: 'https://discord.com/interactions/123/SECRET_TOKEN/callback',
		});

		assert.deepEqual(safeErrorDetails(error), {
			code: 10_062,
			status: 429,
			type: 'Error',
		});
	});

	it('rejects unsafe diagnostic fields and non-errors', () => {
		const error = Object.assign(new Error('failure'), {
			code: 'SECRET_CODE',
			status: 999,
		});

		assert.deepEqual(safeErrorDetails(error), { type: 'Error' });
		assert.deepEqual(safeErrorDetails('SECRET_THROWN_VALUE'), {
			type: 'UnknownError',
		});
	});
});
