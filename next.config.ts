/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 경고 !!
    // এটি প্রোডাকশন বিল্ডের সময় টাইপ এরর ইগনোর করবে
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;