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
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: true,
  // Disable specific optimizations that might cause issues with native modules
  experimental: {
    // Disable optimizeCss which uses lightningcss and can cause issues
    optimizeCss: false,
    // Keep output tree minimized
    outputFileTracingRoot: process.cwd(),
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
  // Configure webpack to avoid issues with platform-specific modules
  webpack: (config, { dev, isServer }) => {
    // Handle platform-specific modules
    config.externals = [...(config.externals || []), 'lightningcss', '@tailwindcss/oxide'];
    
    return config;
  },
};

module.exports = nextConfig; 