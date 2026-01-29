import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = nextPwa({
  dest: "public",
  disable: isDev,
});

const nextConfig: NextConfig = {
  // Static export only for production (Capacitor Android/iOS builds)
  // Disabled in dev to allow middleware/proxy
  ...(isDev ? {} : { output: "export" }),
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

// Skip PWA wrapper in dev to allow Turbopack (much faster)
export default isDev ? nextConfig : withPWA(nextConfig);
