import assert from 'node:assert/strict';
import { it } from 'node:test';
import { buildCommandPayload } from '../src/deploy.js';

it('buildCommandPayload serializes every command exactly once', () => {
	const commands = [
		{ data: { toJSON: () => ({ name: 'one' }) } },
		{ data: { toJSON: () => ({ name: 'two' }) } },
	];

	assert.deepEqual(buildCommandPayload(commands), [
		{ name: 'one' },
		{ name: 'two' },
	]);
});
