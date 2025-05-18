// Load modules conditionally
let plugins = {
  tailwindcss: {
    config: {
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