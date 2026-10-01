import type { NextConfig } from "next";

// Post images live in Supabase Storage (public "post-images" bucket).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/post-images/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
