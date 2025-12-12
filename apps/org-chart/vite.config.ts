/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@som/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
    },
  },
  plugins: [react() as any],
  // @ts-ignore
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
  },
  optimizeDeps: {
    include: ['@som/api-client', '@som/shared-types'],
  },
  build: {
    commonjsOptions: {
      include: [/@som\/api-client/, /@som\/shared-types/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
})
