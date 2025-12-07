/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Blueprint Theme Mappings
                'bg-canvas': '#0f172a',
                'bg-panel': '#1e293b',
                'bg-surface': '#334155',
                'border-color': '#475569',
                'text-primary': '#f8fafc',
                'text-secondary': '#94a3b8',
                'accent-orange': '#f97316',
                'accent-green': '#10b981',
            },
            fontFamily: {
                'ui': ['Inter', '-apple-system', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
