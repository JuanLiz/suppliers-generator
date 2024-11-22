/** @type {import('next').NextConfig} */
const nextConfig = {
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
