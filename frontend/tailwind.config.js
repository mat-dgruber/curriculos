/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0f1e',
        'dark-surface': '#111827',
        'dark-border': '#1f2937',
        'primary': '#2563eb',
        'primary-hover': '#1d4ed8',
        'accent': '#38bdf8',
        'text-main': '#e2e8f0',
        'text-muted': '#94a3b8',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
