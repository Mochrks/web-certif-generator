/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Jangan menambahkan nilai yang tidak valid ke `externals`
    config.externals = config.externals || [];
    return config;
  },
};

module.exports = nextConfig;
