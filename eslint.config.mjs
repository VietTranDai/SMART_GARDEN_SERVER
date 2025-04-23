// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

const compat = new FlatCompat({
  recommendedConfig: js.configs.recommended,
  supportsAutofix: true,
});

export default [
  // 1. Các rule JS cơ bản
  ...compat.extends('eslint:recommended'),

  // 2. Rule TypeScript
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends(
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ),

  // 3. Rule Prettier
  ...compat.extends('plugin:prettier/recommended'),

  // 4. Patterns cần bỏ qua
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },

  // 5. Cấu hình parser, plugin và các rule override
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': 'error',
    },
  },
];
