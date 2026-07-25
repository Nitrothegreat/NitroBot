import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OperationalError, safeErrorDetails } from '../src/errors.js';

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

	it('formats only reason-specific operational context', () => {
		assert.deepEqual(
			safeErrorDetails(new OperationalError(
				'CONFIG_VARIABLE_MISSING',
				{ variable: 'DISCORD_TOKEN' },
			)),
			{
				context: { variable: 'DISCORD_TOKEN' },
				reason: 'CONFIG_VARIABLE_MISSING',
				type: 'OperationalError',
			},
		);
		assert.deepEqual(
			safeErrorDetails(new OperationalError(
				'COMMAND_MODULE_INVALID',
				{ file: 'bad-command.js' },
			)),
			{
				context: { file: 'bad-command.js' },
				reason: 'COMMAND_MODULE_INVALID',
				type: 'OperationalError',
			},
		);
		assert.deepEqual(
			safeErrorDetails(new OperationalError('DEPLOY_COMMAND_SET_EMPTY')),
			{
				reason: 'DEPLOY_COMMAND_SET_EMPTY',
				type: 'OperationalError',
			},
		);
	});

	it('rejects forged, invalid, accessor, and proxy diagnostics safely', () => {
		const forged = Object.assign(new Error('SECRET_MESSAGE'), {
			context: { variable: 'DISCORD_TOKEN' },
			reason: 'CONFIG_VARIABLE_MISSING',
		});
		assert.deepEqual(safeErrorDetails(forged), { type: 'Error' });

		assert.deepEqual(
			safeErrorDetails(new OperationalError(
				'CONFIG_VARIABLE_MISSING',
				{ variable: 'SECRET_VARIABLE' },
			)),
			{ type: 'Error' },
		);
		assert.deepEqual(
			safeErrorDetails(new OperationalError(
				'COMMAND_MODULE_INVALID',
				{ file: '../SECRET_PATH.js' },
			)),
			{ type: 'Error' },
		);

		const accessorError = new Error('SECRET_ACCESSOR');
		Object.defineProperty(accessorError, 'code', {
			get() {
				throw new Error('SECRET_GETTER');
			},
		});
		assert.deepEqual(safeErrorDetails(accessorError), { type: 'Error' });

		const proxy = new Proxy(new Error('SECRET_PROXY'), {
			getPrototypeOf() {
				throw new Error('SECRET_PROXY_TRAP');
			},
		});
		assert.deepEqual(safeErrorDetails(proxy), { type: 'UnknownError' });
	});
});
