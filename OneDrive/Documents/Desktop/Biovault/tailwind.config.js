/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        biovault: {
          bg: "#F7F9FC",
          'bg-dark': "#0D1220",
          primary: "#D6E4F0",
          'primary-dark': "#1A2A4A",
          secondary: "#C8E6D9",
          accent: "#FFE0B5",
          fallback: "#FFB7B2",
          navy: "#1E2A47",
          slate: "#4A5568",
          glow: "#60A5FA",
          mint: "#34D399",
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'draw': 'draw 1s ease forwards',
        'spin-slow': 'spin 8s linear infinite',
        'counter': 'counter 1s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(96, 165, 250, 0.4)' },
          '50%': { boxShadow: '0 0 50px rgba(96, 165, 250, 0.9), 0 0 80px rgba(52, 211, 153, 0.4)' },
        },
        scan: {
          '0%': { top: '0%', opacity: '1' },
          '100%': { top: '100%', opacity: '0.3' },
        },
        draw: {
          '0%': { strokeDashoffset: '300' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    }
  },
  plugins: [],
}
