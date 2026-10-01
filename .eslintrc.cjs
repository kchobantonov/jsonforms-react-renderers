/** Shared workspace lint rules. Formatting is checked separately by Prettier. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: { browser: true, node: true, es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    // JSON Forms values and extension APIs legitimately accept arbitrary data.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    // TypeScript owns props and module resolution (including package exports).
    'react/prop-types': 'off',
    'import/no-unresolved': 'off',
    'import/no-named-as-default': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    // This package uses TypeScript's automatic JSX runtime.
    {
      files: ['packages/jsonforms-react-shadcn-webcomponent/**/*.{ts,tsx}'],
      extends: ['plugin:react/jsx-runtime'],
    },
    {
      files: ['**/test/**', '**/*.{test,spec}.{ts,tsx}', '**/vitest*.{ts,js}'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.{js,cjs,mjs}'],
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
};
