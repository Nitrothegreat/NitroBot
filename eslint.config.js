import eslint from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: ['coverage/**', 'node_modules/**'],
	},
	eslint.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2024,
			globals: globals.node,
			sourceType: 'module',
		},
		rules: {
			'no-console': 'off',
			'no-duplicate-imports': 'error',
			'no-shadow': 'error',
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'prefer-const': 'error',
		},
	},
];
