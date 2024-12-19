import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import tsParser from '@typescript-eslint/parser';
// eslint-disable-next-line import/no-extraneous-dependencies
import _import from 'eslint-plugin-import';
// eslint-disable-next-line import/no-extraneous-dependencies
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/node_modules', '**/node_modules/*', '**/dist', 'webpack.config.js'],
  },
  ...fixupConfigRules(
    compat.extends(
      'plugin:@typescript-eslint/recommended',
      'airbnb-base',
      'airbnb-typescript/base',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:prettier/recommended',
    ),
  ),
  {
    plugins: {
      import: fixupPluginRules(_import),
      '@stylistic/ts': stylisticTs,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'commonjs',

      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },

    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: 'src',
        },
      },
    },

    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'class-methods-use-this': 'off',
      'import/prefer-default-export': 'off',
      'no-use-before-define': 'off',
      'space-before-blocks': 'error',
      '@typescript-eslint/no-use-before-define': 'off',

      '@typescript-eslint/lines-between-class-members': 'off',
      '@stylistic/ts/lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: false },
      ],
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external', 'internal']],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
