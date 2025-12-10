/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Deep Void Theme Mappings
                'bg-canvas': '#020617', // slate-950
                'bg-panel': '#0f172a',  // slate-900
                'bg-surface': '#1e293b', // slate-800
                'border-color': '#334155', // slate-700
                'text-primary': '#ffffff', // white
                'text-secondary': '#94a3b8', // slate-400
                'accent-cyan': '#22d3ee', // cyan-400 (Electric Pulse)
                'accent-orange': '#f59e0b', // amber-500 (Warning)
                'accent-critical': '#dc2626', // red-600 (Critical)
                'accent-valid': '#34d399', // emerald-400 (Valid)
            },
            fontFamily: {
                'ui': ['Inter', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
}
