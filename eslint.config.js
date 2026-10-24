// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'games/dist/*', '.expo/*'],
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      // Feature code stays fully typed (FRONTEND.md §16).
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Game bundles and the SDK shell run in a browser (the WebView), not React Native.
    files: ['game-sdk/**/*.js', 'games/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, GameReels: 'readonly' } },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['jest.setup.ts', '**/__tests__/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
