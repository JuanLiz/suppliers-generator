/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.API_HOST + "/:path*",
      },
    ];
  },
};

export default nextConfig;
