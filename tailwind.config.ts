import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy variables for compatibility
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Design system colors
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)", 
        "primary-light": "var(--color-primary-light)",
        "accent-purple": "var(--color-accent-purple)",
        "accent-green": "var(--color-accent-green)",
        "accent-teal": "var(--color-accent-teal)",
        "dark-gray": "var(--color-dark-gray)",
        "medium-gray": "var(--color-medium-gray)",
        "light-gray": "var(--color-light-gray)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',
        'normal': 'var(--transition-normal)',
        'slow': 'var(--transition-slow)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'var(--color-dark-gray)',
            maxWidth: 'none',
            h1: {
              color: 'var(--color-dark-gray)',
              fontWeight: '700',
            },
            h2: {
              color: 'var(--color-dark-gray)',
              fontWeight: '600',
            },
            'ul > li': {
              position: 'relative',
              paddingLeft: '1.5em',
            },
            'ul > li::before': {
              content: '""',
              width: '0.5em',
              height: '0.5em',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              position: 'absolute',
              left: 0,
              top: '0.5em',
            },
            strong: {
              color: 'var(--color-dark-gray)',
              fontWeight: '600',
            },
            a: {
              color: 'var(--color-primary)',
              '&:hover': {
                color: 'var(--color-primary-dark)',
              },
            },
            code: {
              color: 'var(--color-accent-purple)',
              backgroundColor: 'var(--color-light-gray)',
              borderRadius: '0.25rem',
              padding: '0.125rem 0.25rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
