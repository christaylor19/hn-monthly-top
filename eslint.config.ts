import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import solid from 'eslint-plugin-solid/configs/typescript';

export default tseslint.config(
  { ignores: ['**/dist/', '**/node_modules/', '.pnpm-store/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    ...solid,
  },
  {
    files: ['apps/frontend/src/components/SummaryPanel.tsx'],
    rules: { 'solid/no-innerhtml': 'off' },
  },
);
