/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, { isServer }) {
    if (isServer) {
      // Ensure node: built-ins are never polyfilled by webpack.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }, callback) => {
          if (/^node:/.test(request)) return callback(null, `commonjs ${request}`);
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;

