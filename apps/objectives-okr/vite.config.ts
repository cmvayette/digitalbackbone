import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() as any],
  // @ts-expect-error Vitest types mismatch
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
