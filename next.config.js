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
};

module.exports = nextConfig;
