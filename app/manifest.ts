import type { MetadataRoute } from 'next';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t(site.name),
    short_name: t(site.name),
    description: t(site.hero.body),
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf8f3',
    theme_color: '#6f4e37',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
