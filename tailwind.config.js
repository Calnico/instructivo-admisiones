import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    "./src/**/*.{html,ts}",
    "./src/app/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});