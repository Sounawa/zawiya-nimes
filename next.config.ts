import type { NextConfig } from "next";

/* Sur Netlify comme sur Vercel, le runtime officiel Next.js construit
   et sert l'app lui-même — le mode "standalone" ne doit être demandé
   que pour le serveur autonome de la sandbox. */
const hebergeurManage = process.env.NETLIFY === "true" || process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(hebergeurManage ? {} : { output: "standalone" as const }),
  /* Turso/libsql : paquets avec binaires natifs — jamais bundlés par
     webpack (sinon le build échoue sur les README de libsql), chargés
     depuis node_modules à l'exécution. */
  serverExternalPackages: [
    "libsql",
    "@libsql/client",
    "@prisma/adapter-libsql",
  ],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
