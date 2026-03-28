import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 100],
    remotePatterns: [{ protocol: "https", hostname: "monovex.monofactor.com" }],
  },
  serverExternalPackages: ["yjs"],
  turbopack: {
    rules: {
      // Import *.raw.css files as plain strings (not processed as CSS modules)
      "*.raw.css": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    // Webpack fallback: import *.raw.css as plain strings
    config.module.rules.unshift({
      test: /\.raw\.css$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
