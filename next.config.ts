import nextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = nextIntlPlugin("./src/lib/i18n.ts");

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost", "api.diasporatontine.com"],
  },

  // ✅ Optimisations mémoire et cache
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = false;
    }
    return config;
  },

  experimental: {
    workerThreads: false,
    cpus: 1,
    // ✅ Optimiser les imports des grandes librairies
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },

  // ✅ Tree-shaking agressif pour lucide-react
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
  },
};

export default withNextIntl(nextConfig);