import { siteConfig } from '@/lib/seo';

export default function sitemap() {
  const baseUrl = siteConfig.url;
  const currentDate = new Date().toISOString();

  const routes = [
    '',
    '/about',
    '/worship',
    '/ministries',
    '/financial',
    '/projects',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '/financial' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
