import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      'client/**/*.test.ts',
      'client/**/*.test.tsx',
      'convex/**/*.test.ts',
      'script/**/*.test.mjs',
    ],
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
    },
  },
});
