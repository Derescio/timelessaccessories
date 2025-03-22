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
    domains: [
      "www.paypalobjects.com",
      "hebbkx1anhila5yf.public.blob.vercel-storage.com",
    ],
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
    ],
  },
};

module.exports = nextConfig;
