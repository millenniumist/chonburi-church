import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,

  // Image optimization runs via sharp inside the Pi's Node process. Drop AVIF
  // (the most CPU-heavy encode), trim the variant matrix, and cache aggressively
  // so a cold-cache burst of visitors can't pin all cores.
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 2678400, // 31 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Tree-shake heavy barrel packages so client bundles and SSR stay lean.
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // pg is a server-only native-ish module; keep it out of the bundle.
  serverExternalPackages: ['pg'],
};

export default nextConfig;
