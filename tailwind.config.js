/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
  theme: {
    container: {
      screens: {
        "2xl": "1290px",
      },
    },
    fontFamily: {
      heading: ["var(--font-tomorrow)", "serif"],
      body: ["var(--font-manrope)", "sans-serif"],
    },
    extend: {
      fontSize: {
        "32x": "32px",
        "40x": "40px",
        "64x": "64px",
      },
      colors: {
        "b-900": "#540E23",
        "b-800": "#6A122B",
        "b-700": "#801634",
        "b-600": "#96193C",
        "b-500": "#AB1D44",
        "b-400": "#C1214C",
        "b-300": "#D72555",
        "b-200": "#ED285D",
        "b-100": "#FF2C66",
        "b-50": "#FF477A",
        "w-900": "#FFFFFF",
        "w-800": "#F8F8F8",
        "w-700": "#F2F2F2",
        "w-600": "#ECECEC",
        "w-500": "#E6E6E6",
        "w-400": "#DFDFDF",
        "w-300": "#D9D9D9",
        "w-200": "#D3D3D3",
        "w-100": "#CCCCCC",
        "w-50": "#C6C6C6",
        "border-r": "#8E1B3E",
        primary: "#8E1B3E",
        secondary: "#ffc82f",
        text: "#121212",
        "tropical-indigo": "#FFFFFF",
      },
    },
  },
};

export default tailwindConfig;
