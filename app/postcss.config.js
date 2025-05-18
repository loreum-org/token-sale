// Load modules conditionally
let plugins = {
  '@tailwindcss/postcss': {
    config: {
      content: ['./src/**/*.{js,ts,jsx,tsx}'],
      future: {
        // Disable Oxide engine
        unstable_oxide: false,
      },
    },
  }
};

// Add autoprefixer only if it's available
try {
  require.resolve('autoprefixer');
  plugins.autoprefixer = {};
} catch (e) {
  console.warn('Autoprefixer not found, skipping...');
}

module.exports = {
  plugins
}; 