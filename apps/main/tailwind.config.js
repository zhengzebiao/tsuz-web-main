export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: {
          bg: "#f5f7fb",
          text: "#172033"
        }
      }
    }
  },
  plugins: []
};
