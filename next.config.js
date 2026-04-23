/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/hellokopi',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
