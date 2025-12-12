import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  // @ts-expect-error - Vitest types are not picked up by defineConfig
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  },
  optimizeDeps: {
    include: ['@som/semantic-linter/runtime']
  },
  resolve: {
    alias: {
      '@som/ui-components/styles': path.resolve(__dirname, '../../packages/ui-components/src/styles/blueprint.css'),
      '@som/ui-components': path.resolve(__dirname, '../../packages/ui-components/src/index.ts'),
      '@som/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts')
    }
  }
})
