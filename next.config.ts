import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tmdolblsg0vd3laa.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
