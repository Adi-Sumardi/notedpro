/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  cleanDistDir: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
