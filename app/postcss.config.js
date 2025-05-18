module.exports = {
  plugins: {
    tailwindcss: {
      config: {
        future: {
          // Disable Oxide engine
          unstable_oxide: false,
        },
      },
    },
    autoprefixer: {},
  },
}; 