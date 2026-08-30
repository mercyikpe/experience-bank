import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Google is the only sign-in provider today, and its account photos are
    // served from a *.googleusercontent.com subdomain that varies (lh3, lh4,
    // ...) — wildcarded rather than pinned to one, since which subdomain a
    // given photo lands on isn't something we control.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
