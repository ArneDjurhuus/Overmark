import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Static export for Capacitor Android/iOS builds
  output: "export",
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
