/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Set output to standalone for Docker deployments
  output: 'standalone',
  
  // Keep output tree minimized (moved from experimental)
  outputFileTracingRoot: process.cwd(),
  
  // Completely disable specific optimizations that cause issues
  experimental: {
    // Disable optimizeCss completely
    optimizeCss: false,
  },
  
  // Increase build timeout for Railway deployments
  staticPageGenerationTimeout: 180,
  
  // Additional security headers
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Configure webpack to disable problematic modules
  webpack: (config, { isServer }) => {
    // Completely exclude problematic native modules
    config.externals = [...(config.externals || [])];
    
    if (!isServer) {
      // Replace native module with empty module in client builds
      config.resolve.alias = {
        ...config.resolve.alias,
        'lightningcss': false,
        '@tailwindcss/oxide': false
      };
    }
    
    // Disable minification to avoid issues with native modules
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer = [];
    }
    
    return config;
  },
  
  // Disable source maps in production to reduce build complexity
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig; 