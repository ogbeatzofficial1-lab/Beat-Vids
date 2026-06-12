import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Move turbopack to the top level, NOT inside experimental
  turbopack: {
    root: '.', // This tells Next.js where your project root is
  },
  
  // Any other valid options...
};

export default nextConfig;
