/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base':       '#1C1C2E',
        'bg-elevated':   '#2A2A3E',
        'bg-card':       '#3A3A52',
        'bg-warm':       '#2E2820',
        'border-subtle': '#4A4A62',
        'text-primary':  '#E8E0D5',
        'text-heading':  '#F2EDE6',
        'text-secondary':'#C8BFB4',
        'text-dim':      '#9A9088',
        accent:          '#7C8CF8',
        'accent-light':  '#A0ACFF',
        'accent-dark':   '#5A6AE8',
        'accent-glow':   '#3D4D9E',
        success:         '#6BCB8B',
        warning:         '#F0B860',
        slip:            '#E07070',
        info:            '#7CC8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.1', fontWeight: '300' }],
        'h1':      ['2rem',   { lineHeight: '1.2', fontWeight: '400' }],
        'h2':      ['1.625rem',{ lineHeight: '1.25',fontWeight: '400' }],
        'h3':      ['1.375rem',{ lineHeight: '1.3', fontWeight: '500' }],
        'body-lg': ['1.125rem',{ lineHeight: '1.6', fontWeight: '400' }],
        'body':    ['1rem',   { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem',{ lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem',{ lineHeight: '1.4', fontWeight: '400' }],
      },
      boxShadow: {
        'accent-glow': '0 0 24px rgba(61, 77, 158, 0.25)',
        'accent-btn':  '0 4px 16px rgba(61, 77, 158, 0.4)',
        'inner-focus': '0 0 0 3px rgba(124, 140, 248, 0.2)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.6s ease-out forwards',
        'slide-up':    'slideUp 0.45s cubic-bezier(0.0,0.0,0.2,1) forwards',
        'shake':       'shake 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-4px)' },
          '40%':      { transform: 'translateX(4px)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
      },
      transitionDuration: {
        '450': '450ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}
