import type { NextConfig } from "next";

/**
 * Next.js configuration for Timeless Accessories
 */
const nextConfig: NextConfig = {
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
};

export default nextConfig;