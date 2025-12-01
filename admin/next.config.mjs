/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "jocdn.sfo3.cdn.digitaloceanspaces.com", // Add your external image host
    ],
     
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  }
};

export default nextConfig;
