/** @type {import('tailwindcss').Config} */
export const content = [
  // Vérifie bien que ces chemins correspondent à ton projet
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
];
export const theme = {
  extend: {
    colors: {
      // Le bleu "Nexus" (boutons, liens, accents)
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb', // Bleu principal
        700: '#1d4ed8',
      },
      // Gris neutres pour le fond et les textes
      gray: {
        50: '#f9fafb', // Fond global (très léger)
        100: '#f3f4f6', // Fond des cartes
        200: '#e5e7eb', // Bordures
        500: '#6b7280', // Textes secondaires
        600: '#4b5563',
        900: '#111827', // Titres
      }
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    boxShadow: {
      'soft': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
    }
  },
};
export const plugins = [];