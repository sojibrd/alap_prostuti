import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves files only: no Node server, so a static export.
  // cacheComponents (and partialPrefetching with it) need a server, so off.
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/alap_prostuti" : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Tailwind through Turbopack, as create-next-app set it up
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
