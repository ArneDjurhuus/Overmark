import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Static export only for production (Capacitor Android/iOS builds)
  // Disabled in dev to allow middleware/proxy
  ...(isDev ? {} : { output: "export" }),
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
