/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-mode="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'editor-primary': 'var(--primary)',
        'editor-on-primary': 'var(--onPrimary)',
        'editor-background': 'var(--bg)',
        'editor-surface': 'var(--surface)',
        'editor-text': 'var(--text)',
        'editor-muted': 'var(--textSecondary)',
        'editor-border': 'var(--border)',
        primary: 'var(--primary)',
        'on-primary': 'var(--onPrimary)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        'text-secondary': 'var(--textSecondary)',
        border: 'var(--border)',
        error: 'var(--error)',
        warning: 'var(--warning)',
      },
    },
  },
  plugins: [],
};
