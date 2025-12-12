/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()] as any,
  resolve: {
    alias: {
      '@som/api-client': path.resolve(__dirname, '../../packages/api-client/src'),
      '@som/shared-types': path.resolve(__dirname, '../../packages/som-shared-types/src'),
      '@som/ui-components/styles': path.resolve(__dirname, '../../packages/ui-components/src/styles/blueprint.css'),
      '@som/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
    },
  },
  // @ts-expect-error Vitest types not automatically merged
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
