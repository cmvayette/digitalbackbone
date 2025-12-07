/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blueprint-inspired palette
        slate: {
          900: '#10161a', // Blueprint Dark Gray 1
          800: '#182026', // Blueprint Dark Gray 2
          700: '#202b33', // Blueprint Dark Gray 3
          600: '#293742', // Blueprint Dark Gray 4
          500: '#30404d', // Blueprint Dark Gray 5
        },
        primary: {
          500: '#106ba3', // Blueprint Blue 3
          400: '#137cbd', // Blueprint Blue 2
          300: '#2b95d6', // Blueprint Blue 1
        },
        intent: {
          success: '#0f9960', // Blueprint Green 3
          warning: '#d9822b', // Blueprint Orange 3
          danger: '#db3737', // Blueprint Red 3
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
