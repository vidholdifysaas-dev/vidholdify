import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1735p3aqhycef.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "vidholdify-video.s3.us-east-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
