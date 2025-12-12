import { type UserConfig, mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

interface AppConfigOptions {
    port?: number;
    test?: any;
}


export function createAppConfig(options: AppConfigOptions = {}, overrideConfig: UserConfig = {}) {
    const { port = 3000, test = {} } = options;

    const baseConfig: UserConfig & { test?: any } = {
        plugins: [
            react(),
            tsconfigPaths()
        ],
        server: {
            port,
            host: true
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/setupTests.ts',
            css: true,
            ...test
        }
    };

    return mergeConfig(baseConfig, overrideConfig);
}
