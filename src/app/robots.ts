import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://life-os-ghost-a56a.vercel.app';
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
