/** @type {import('next').NextConfig} */
const nextConfig = {
  // Clean stale dist files on startup to prevent 500 errors from corrupted cache
  cleanDistDir: true,
};

export default nextConfig;
