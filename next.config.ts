import type { NextConfig } from "next";

/**
 * Next.js configuration for Timeless Accessories
 */
const nextConfig: NextConfig = {
  // Transpile Sanity packages to ensure webpack config is applied
  transpilePackages: ['sanity', '@sanity/vision', '@sanity/ui', '@sanity/structure'],
  images: {
    // domains: [
    //   // Vercel Blob Storage
    //   'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      
    //   // UploadThing domains
    //   'utfs.io',
    //   'z8rvk24gry.ufs.sh',
    //   'uploadthing.com',
    //   'uploadthing-prod.s3.us-west-2.amazonaws.com',
    // ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'z8rvk24gry.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: '"merchant-portal.lascobizja.com',
      },
      {
        protocol: 'https',
        hostname: '*.uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Provide useEffectEvent polyfill for Sanity packages that expect it from React
    // This is needed because React 19 removed the experimental useEffectEvent hook
    const path = require('path');
    
    // Alias 'react' to our wrapper that includes useEffectEvent
    // This wrapper re-exports everything from React plus useEffectEvent from the polyfill
    // Since it's a superset of React, it's safe to use for all React imports
    // Apply to both server and client to ensure consistency
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(__dirname, 'lib/react-with-useeffectevent.js'),
    };
    
    return config;
  },
};

export default nextConfig;