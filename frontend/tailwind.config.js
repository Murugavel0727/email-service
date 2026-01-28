/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Enhanced dark theme colors
                gray: {
                    700: '#40414f',
                    800: '#343541',
                    900: '#202123',
                    950: '#0f0f0f',
                },
                gpt: {
                    // Backgrounds
                    dark: '#171717',        // Sidebar - deeper black
                    gray: '#212121',        // Main background - refined dark
                    light: '#2f2f2f',       // Assistant message bg - elevated surface
                    surface: '#1a1a1a',     // Cards and elevated elements

                    // Interactive elements
                    input: '#2f2f2f',       // Input field - matches light
                    hover: '#2a2a2a',       // Sidebar hover - subtle
                    hoverBright: '#3a3a3a', // Brighter hover state

                    // Accents
                    accent: '#10a37f',      // Primary accent - ChatGPT teal
                    accentHover: '#0d8c6a', // Accent hover state
                    accentLight: '#19c37d', // Lighter accent variant

                    // Text
                    text: '#ececec',        // Primary text - high contrast
                    textDim: '#b4b4b4',     // Secondary text - dimmed
                    textMuted: '#8e8e8e',   // Tertiary text - muted

                    // Borders
                    border: 'rgba(255, 255, 255, 0.1)',
                    borderBright: 'rgba(255, 255, 255, 0.2)',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-accent': 'linear-gradient(135deg, #10a37f 0%, #19c37d 100%)',
                'gradient-surface': 'linear-gradient(145deg, #2f2f2f 0%, #252525 100%)',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(16, 163, 127, 0.3)',
                'glow-sm': '0 0 10px rgba(16, 163, 127, 0.2)',
                'elevation': '0 4px 12px rgba(0, 0, 0, 0.4)',
                'elevation-lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'typing': 'typing 1.4s ease-in-out infinite',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                typing: {
                    '0%, 100%': { opacity: '0.3' },
                    '50%': { opacity: '1' },
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
