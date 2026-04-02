import type { NextConfig } from "next";

// Parse API URL from env to auto-configure image domains
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const parsedApiUrl = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: parsedApiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: parsedApiUrl.hostname,
        port: parsedApiUrl.port || undefined,
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
