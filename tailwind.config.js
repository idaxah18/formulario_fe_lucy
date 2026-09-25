import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{vue,js}',
    ],
    theme: {
        extend: {
            fontFamily: {
                solution: ['"Gotham Rounded"', ...defaultTheme.fontFamily.sans],
                tagline: ['"Gotham"', ...defaultTheme.fontFamily.sans],
                sans: ['"Gotham"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                lucy: {
                    navy: '#202246',
                    indigo: '#292c5d',
                    blue: '#1b5a9e',
                    forest: '#174225',
                    green: '#136733',
                    olive: '#7d9533',
                    burgundy: '#9c1c2d',
                    orange: '#e2682f',
                    gold: '#E8A317',
                    surface: '#f4f6f9',
                },
            },
            backgroundImage: {
                'gradient-lucy-blue':
                    'linear-gradient(90deg, #202246 0%, #292c5d 50%, #1b5a9e 100%)',
                'gradient-lucy-green':
                    'linear-gradient(90deg, #174225 0%, #136733 50%, #7d9533 100%)',
                'gradient-lucy-warm':
                    'linear-gradient(90deg, #9c1c2d 0%, #9c1c2d 50%, #e2682f 100%)',
            },
            boxShadow: {
                card: '0 8px 24px rgba(32, 34, 70, 0.12)',
            },
            borderRadius: {
                xl: '1rem',
                '2xl': '1.25rem',
            },
        },
    },
    plugins: [],
};
