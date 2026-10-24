import type { MetadataRoute } from 'next';
import { getValidSiteUrl } from '@/lib/utils/url';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getValidSiteUrl().toString().replace(/\/+$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/tasks',
        '/finances',
        '/notes',
        '/projects',
        '/assignments',
        '/habits',
        '/settings',
        '/auth/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
