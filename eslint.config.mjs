import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import prettier from 'eslint-plugin-prettier';

export default tseslint.config(
  { ignores: [] },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [
      pluginJs.configs.recommended,
      ...tseslint.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    plugins: {
      prettier,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
