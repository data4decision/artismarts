/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: false, // ← add this
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iwfjgvurissjsyybmlrn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/portfolio/**',
      },
      {
        protocol: 'https',
        hostname: 'iwfjgvurissjsyybmlrn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/profile-photos/**',
      },
    ],
  },
};

module.exports = nextConfig;