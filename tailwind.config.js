export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        midas: {
          navy: "#0f2742",
          blue: "#1d4f8f",
          green: "#16825d",
          amber: "#d18b16",
          red: "#c24136",
          ink: "#172033",
          line: "#d8dee8",
          panel: "#f7f9fc"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 39, 66, 0.08)"
      }
    }
  },
  plugins: []
};
