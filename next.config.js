/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable proper error checking
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
    // Strict mode for better code quality
    dirs: ["app", "components", "lib", "types", "prisma"],
  },
  typescript: {
    // Run TypeScript validation during builds
    ignoreBuildErrors: false,
  },
  images: {
    // remotePatterns: [
    //   "uploadthing.com",
    //   "utfs.io",
    //   "img.clerk.com",
    //   "subdomain",
    //   "files.stripe.com",
    // ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.paypal.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "s.alicdn.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: '"merchant-portal.lascobizja.com',
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "files.stripe.com",
        pathname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

module.exports = nextConfig;
