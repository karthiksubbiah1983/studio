/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This is the new configuration to allow cross-origin requests in dev mode.
  experimental: {
  },
  allowedDevOrigins: [
     "https://9000-firebase-studio-1758224949257.cluster-ikslh4rdsnbqsvu5nw3v4dqjj2.cloudworkstations.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
