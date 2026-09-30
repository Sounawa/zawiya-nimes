import type { NextConfig } from "next";

/* Sur Netlify, le runtime officiel Next.js construit et sert l'app
   lui-même — le mode "standalone" ne doit être demandé que pour le
   serveur autonome de la sandbox. */
const estNetlify = process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  ...(estNetlify ? {} : { output: "standalone" as const }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
