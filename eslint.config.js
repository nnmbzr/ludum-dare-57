import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, {
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'spaced-comment': [
      'warn',
      'always',
      {
        markers: ['/'],
      },
    ],
  },
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: tseslint.parser,
    globals: {
      // Здесь перечисляем глобальные переменные, которые раньше определялись через env
      window: true,
      document: true,
    },
  },
  // Удалили env и добавили linterOptions
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
});
